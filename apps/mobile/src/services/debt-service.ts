import { and, asc, eq, inArray } from "drizzle-orm";
import { transactionsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { getAccountsWithBalances } from "./account-service";

const DEBT_TYPES = ["debt_lend", "debt_borrow"] as const;

export type DebtPerson = {
  contactId: number;
  name: string;
  gave: number; // Σ debt_lend (you gave)
  got: number; // Σ debt_borrow (you got)
  net: number; // gave − got: >0 they owe you, <0 you owe them
};

export type DebtLedger = {
  people: DebtPerson[]; // non-zero net, sorted by |net| desc
  receivable: number; // Σ max(0, net) — owed to you
  payable: number; // Σ max(0, −net) — you owe
  net: number; // receivable − payable
};

// Per-person running balances across all debt events.
export async function getDebtLedger(db: Db, userId: string): Promise<DebtLedger> {
  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      inArray(transactionsTable.type, [...DEBT_TYPES]),
    ),
    columns: { type: true, amount: true, contactId: true },
    with: { contact: { columns: { id: true, name: true } } },
  });

  const map = new Map<number, DebtPerson>();
  for (const r of rows) {
    if (r.contactId == null) continue;
    let p = map.get(r.contactId);
    if (!p) {
      p = {
        contactId: r.contactId,
        name: r.contact?.name ?? "Unknown",
        gave: 0,
        got: 0,
        net: 0,
      };
      map.set(r.contactId, p);
    }
    if (r.type === "debt_lend") p.gave += r.amount;
    else p.got += r.amount;
  }

  let receivable = 0;
  let payable = 0;
  const people: DebtPerson[] = [];
  for (const p of map.values()) {
    p.net = p.gave - p.got;
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
  runningBalance: number; // net (gave−got) up to and including this entry
};

// One person's chronological ledger with a running balance (newest first for
// display; running balance computed oldest→newest).
export async function getContactDebtEntries(
  db: Db,
  userId: string,
  contactId: number,
): Promise<{ entries: DebtEntry[]; net: number; name: string }> {
  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      eq(transactionsTable.contactId, contactId),
      inArray(transactionsTable.type, [...DEBT_TYPES]),
    ),
    orderBy: asc(transactionsTable.date),
    with: {
      account: { columns: { name: true } },
      contact: { columns: { name: true } },
    },
  });

  let running = 0;
  const entries: DebtEntry[] = rows.map((r) => {
    const type = r.type as "debt_lend" | "debt_borrow";
    running += type === "debt_lend" ? r.amount : -r.amount;
    const date = r.date instanceof Date ? r.date : new Date(r.date as number);
    return {
      id: r.id,
      type,
      amount: r.amount,
      date,
      note: r.note,
      accountId: r.accountId,
      accountName: r.account?.name ?? null,
      runningBalance: running,
    };
  });
  entries.reverse(); // newest first

  return { entries, net: running, name: rows[0]?.contact?.name ?? "" };
}

export type NetWorth = {
  accountsTotal: number;
  receivable: number;
  payable: number;
  netWorth: number;
};

// True net worth = money in accounts + what's owed to you − what you owe.
export async function getNetWorth(db: Db, userId: string): Promise<NetWorth> {
  const [{ total }, ledger] = await Promise.all([
    getAccountsWithBalances(db, userId),
    getDebtLedger(db, userId),
  ]);
  return {
    accountsTotal: total,
    receivable: ledger.receivable,
    payable: ledger.payable,
    netWorth: total + ledger.receivable - ledger.payable,
  };
}
