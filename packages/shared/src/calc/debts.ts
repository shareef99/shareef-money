import { type TimeBucket, bucketKey, bucketLabel } from "./stats";

export type DebtPerson = {
  contactId: number;
  name: string;
  gave: number; // Σ debt_lend (you gave)
  got: number; // Σ debt_borrow (you got)
  net: number; // gave − got: >0 they owe you, <0 you owe them
  dueDate: Date | null; // earliest due date among this person's debt entries
  overdue: boolean; // still owed (net !== 0) and dueDate is in the past
};

export type DebtLedger = {
  people: DebtPerson[]; // non-zero net, sorted by |net| desc
  receivable: number; // Σ max(0, net) — owed to you
  payable: number; // Σ max(0, −net) — you owe
  net: number; // receivable − payable
};

export type DebtLedgerTxn = {
  type: "debt_lend" | "debt_borrow";
  amount: number;
  contactId: number | null;
  dueDate: Date | null;
  contactName: string | null;
};

// Per-person running balances across all debt events.
export function computeDebtLedger(txns: DebtLedgerTxn[], now: number): DebtLedger {
  const map = new Map<number, DebtPerson>();
  for (const r of txns) {
    if (r.contactId == null) continue;
    let p = map.get(r.contactId);
    if (!p) {
      p = {
        contactId: r.contactId,
        name: r.contactName ?? "Unknown",
        gave: 0,
        got: 0,
        net: 0,
        dueDate: null,
        overdue: false,
      };
      map.set(r.contactId, p);
    }
    if (r.type === "debt_lend") p.gave += r.amount;
    else p.got += r.amount;
    if (r.dueDate) {
      const d = r.dueDate;
      if (!p.dueDate || d < p.dueDate) p.dueDate = d; // earliest due date
    }
  }

  let receivable = 0;
  let payable = 0;
  const people: DebtPerson[] = [];
  for (const p of map.values()) {
    p.net = p.gave - p.got;
    p.overdue = p.net !== 0 && p.dueDate != null && p.dueDate.getTime() < now;
    if (p.net > 0) receivable += p.net;
    else if (p.net < 0) payable += -p.net;
    if (p.net !== 0) people.push(p);
  }
  people.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return { people, receivable, payable, net: receivable - payable };
}

export type DebtEntry = {
  id: number;
  type: "debt_lend" | "debt_borrow";
  amount: number;
  date: Date;
  note: string | null;
  accountId: number;
  accountName: string | null;
  dueDate: Date | null;
  runningBalance: number; // net (gave−got) up to and including this entry
};

export type ContactDebtTxn = {
  id: number;
  type: "debt_lend" | "debt_borrow";
  amount: number;
  date: Date;
  note: string | null;
  accountId: number;
  accountName: string | null;
  dueDate: Date | null;
  contactName: string | null;
};

// One person's chronological ledger with a running balance. `txns` must be
// sorted oldest→newest; the result is newest-first for display.
export function computeContactEntries(txns: ContactDebtTxn[]): {
  entries: DebtEntry[];
  net: number;
  name: string;
} {
  let running = 0;
  const entries: DebtEntry[] = txns.map((r) => {
    running += r.type === "debt_lend" ? r.amount : -r.amount;
    return {
      id: r.id,
      type: r.type,
      amount: r.amount,
      date: r.date,
      note: r.note,
      accountId: r.accountId,
      accountName: r.accountName,
      dueDate: r.dueDate,
      runningBalance: running,
    };
  });
  entries.reverse(); // newest first

  return { entries, net: running, name: txns[0]?.contactName ?? "" };
}

export type DebtTrendPoint = {
  key: string;
  label: string;
  receivable: number;
  payable: number;
  net: number;
};

export type DebtTrendTxn = {
  type: "debt_lend" | "debt_borrow";
  amount: number;
  contactId: number | null;
  date: Date;
};

// Receivable/payable position at the end of each bucket across [from,to].
// `txns` are ALL debt transactions dated on or before `to` (history before the
// range folds into the opening snapshot).
export function debtTrend(
  txns: DebtTrendTxn[],
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): DebtTrendPoint[] {
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

  const starts: Date[] = [];
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    starts.push(new Date(cursor));
    keys.push(bucketKey(cursor, bucket, weekStartMonday));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  const perContact = new Map<number, number>();
  const points: DebtTrendPoint[] = [];
  let ti = 0;

  for (let i = 0; i < starts.length; i += 1) {
    const end = i + 1 < starts.length ? starts[i + 1]! : new Date(to.getTime() + 1);
    while (ti < sorted.length) {
      const raw = sorted[ti]!;
      if (raw.date >= end) break;
      if (raw.contactId != null) {
        const v = raw.type === "debt_lend" ? raw.amount : -raw.amount;
        perContact.set(raw.contactId, (perContact.get(raw.contactId) ?? 0) + v);
      }
      ti += 1;
    }

    let receivable = 0;
    let payable = 0;
    for (const net of perContact.values()) {
      if (net > 0) receivable += net;
      else if (net < 0) payable += -net;
    }
    points.push({
      key: keys[i]!,
      label: bucketLabel(keys[i]!, bucket),
      receivable,
      payable,
      net: receivable - payable,
    });
  }

  return points;
}
