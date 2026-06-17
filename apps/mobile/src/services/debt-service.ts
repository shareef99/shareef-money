import { and, asc, eq, inArray } from "drizzle-orm";
import { transactionsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { getAccounts, getAccountsWithBalances } from "./account-service";
import { createTransaction } from "./transaction-service";
import { getOrCreateWriteOffCategory } from "./category-service";

const DEBT_TYPES = ["debt_lend", "debt_borrow"] as const;

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

// Per-person running balances across all debt events.
export async function getDebtLedger(db: Db, userId: string): Promise<DebtLedger> {
  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      inArray(transactionsTable.type, [...DEBT_TYPES]),
    ),
    columns: { type: true, amount: true, contactId: true, dueDate: true },
    with: { contact: { columns: { id: true, name: true } } },
  });

  const now = Date.now();
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
        dueDate: null,
        overdue: false,
      };
      map.set(r.contactId, p);
    }
    if (r.type === "debt_lend") p.gave += r.amount;
    else p.got += r.amount;
    if (r.dueDate) {
      const d = r.dueDate instanceof Date ? r.dueDate : new Date(r.dueDate);
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
    const dueDate = r.dueDate
      ? r.dueDate instanceof Date
        ? r.dueDate
        : new Date(r.dueDate as number)
      : null;
    return {
      id: r.id,
      type,
      amount: r.amount,
      date,
      note: r.note,
      accountId: r.accountId,
      accountName: r.account?.name ?? null,
      dueDate,
      runningBalance: running,
    };
  });
  entries.reverse(); // newest first

  return { entries, net: running, name: rows[0]?.contact?.name ?? "" };
}

// Write off a receivable you don't expect back: settle the balance to zero AND
// record the loss as an expense, so net worth correctly drops by the amount.
// Implemented as a settling "got" (zeroes the receivable, +cash) plus an
// offsetting expense (−cash) — net cash change is zero, net worth falls by the
// written-off amount, and the loss shows in spending stats under "Bad debt".
export async function writeOffDebt(
  db: Db,
  userId: string,
  contactId: number,
  name: string,
): Promise<number> {
  const { entries, net } = await getContactDebtEntries(db, userId, contactId);
  if (net <= 0) return 0; // only receivables can be written off

  const lend = entries.find((e) => e.type === "debt_lend");
  let accountId = lend?.accountId ?? null;
  if (accountId == null) {
    const accounts = await getAccounts(db, userId);
    accountId = accounts[0]?.id ?? null;
  }
  if (accountId == null) return 0;

  const category = await getOrCreateWriteOffCategory(db, userId);
  const now = Date.now();

  await createTransaction(db, userId, {
    type: "debt_borrow",
    amount: net,
    accountId,
    contactId,
    date: now,
    note: `Write-off settle — ${name}`,
  });
  await createTransaction(db, userId, {
    type: "expense",
    amount: net,
    accountId,
    categoryId: category.id,
    date: now,
    note: `Written off — ${name}`,
  });
  return net;
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
