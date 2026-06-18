import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { transactionsTable } from "@shareef-money/db/schema";
import {
  computeDebtLedger,
  computeContactEntries,
  type DebtPerson,
  type DebtLedger,
  type DebtEntry,
} from "@shareef-money/shared/calc";
import type { Db } from "../db/client";
import { getAccounts, getAccountsWithBalances } from "./account-service";
import { createTransaction } from "./transaction-service";
import { getOrCreateWriteOffCategory } from "./category-service";

const DEBT_TYPES = ["debt_lend", "debt_borrow"] as const;

// Re-exported from shared calc so existing imports keep working.
export type { DebtPerson, DebtLedger, DebtEntry };

// Per-person running balances across all debt events. The aggregation lives in
// @shareef-money/shared/calc (shared with web).
export async function getDebtLedger(db: Db, userId: string): Promise<DebtLedger> {
  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      isNull(transactionsTable.deletedAt),
      inArray(transactionsTable.type, [...DEBT_TYPES]),
    ),
    columns: { type: true, amount: true, contactId: true, dueDate: true },
    with: { contact: { columns: { id: true, name: true } } },
  });

  return computeDebtLedger(
    rows.map((r) => ({
      type: r.type as "debt_lend" | "debt_borrow",
      amount: r.amount,
      contactId: r.contactId,
      dueDate: r.dueDate ?? null,
      contactName: r.contact?.name ?? null,
    })),
    Date.now(),
  );
}

// One person's chronological ledger with a running balance.
export async function getContactDebtEntries(
  db: Db,
  userId: string,
  contactId: number,
): Promise<{ entries: DebtEntry[]; net: number; name: string }> {
  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      eq(transactionsTable.contactId, contactId),
      isNull(transactionsTable.deletedAt),
      inArray(transactionsTable.type, [...DEBT_TYPES]),
    ),
    orderBy: asc(transactionsTable.date),
    with: {
      account: { columns: { name: true } },
      contact: { columns: { name: true } },
    },
  });

  return computeContactEntries(
    rows.map((r) => ({
      id: r.id,
      type: r.type as "debt_lend" | "debt_borrow",
      amount: r.amount,
      date: r.date instanceof Date ? r.date : new Date(r.date as number),
      note: r.note,
      accountId: r.accountId,
      accountName: r.account?.name ?? null,
      dueDate: r.dueDate
        ? r.dueDate instanceof Date
          ? r.dueDate
          : new Date(r.dueDate as number)
        : null,
      contactName: r.contact?.name ?? null,
    })),
  );
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
