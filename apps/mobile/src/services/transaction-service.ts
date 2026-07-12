import { eq, and, gte, lte, desc, sql, inArray, or, isNull } from "drizzle-orm";
import {
  transactionsTable,
  transactionContactsTable,
  recurringRulesTable,
} from "@shareef-money/db/schema";
import type { TransactionType } from "@shareef-money/shared/types";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";

type CreateTransactionPayload = {
  type: TransactionType;
  amount: number;
  fee?: number;
  categoryId?: number | null;
  accountId: number;
  toAccountId?: number | null;
  contactId?: number | null; // debt counterparty (debt_lend / debt_borrow)
  dueDate?: number | null; // optional repayment due date (debts)
  locationId?: number | null;
  contactIds?: number[];
  note?: string | null;
  date: number;
};

type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

type TransactionFilters = {
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  categoryIds?: number[];
  accountIds?: number[];
  limit?: number;
  offset?: number;
};

export async function getTransactions(db: Db, userId: string, filters: TransactionFilters = {}) {
  const conditions = [
    eq(transactionsTable.userId, userId),
    isNull(transactionsTable.deletedAt),
  ];

  if (filters.type) conditions.push(eq(transactionsTable.type, filters.type));
  if (filters.dateFrom) conditions.push(gte(transactionsTable.date, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(transactionsTable.date, filters.dateTo));
  if (filters.accountIds?.length) conditions.push(inArray(transactionsTable.accountId, filters.accountIds));
  if (filters.categoryIds?.length) conditions.push(inArray(transactionsTable.categoryId, filters.categoryIds));

  return db.query.transactionsTable.findMany({
    where: and(...conditions),
    orderBy: desc(transactionsTable.date),
    limit: filters.limit ?? 500,
    offset: filters.offset ?? 0,
    with: {
      category: true,
      account: true,
      toAccount: true,
      contact: true,
      location: true,
      transactionContacts: true,
    },
  });
}

// A single transaction by id, with all relations. Used to hydrate the edit modal
// directly, instead of searching the (capped) transactions list — which misses
// any record older than the most-recent page, yet those are reachable to edit via
// Search and the uncapped account history.
export async function getTransactionById(db: Db, userId: string, id: number) {
  return db.query.transactionsTable.findFirst({
    where: and(
      eq(transactionsTable.id, id),
      eq(transactionsTable.userId, userId),
      isNull(transactionsTable.deletedAt),
    ),
    with: {
      category: true,
      account: true,
      toAccount: true,
      contact: true,
      location: true,
      transactionContacts: true,
    },
  });
}

// Every transaction touching an account — as the source OR the transfer target.
// Filtered in SQL (not by loading all rows and filtering in JS) and uncapped, so
// an account's full history is visible regardless of how many transactions exist.
export async function getAccountTransactions(db: Db, userId: string, accountId: number) {
  return db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      isNull(transactionsTable.deletedAt),
      or(
        eq(transactionsTable.accountId, accountId),
        eq(transactionsTable.toAccountId, accountId),
      ),
    ),
    orderBy: desc(transactionsTable.date),
    with: {
      category: true,
      account: true,
      toAccount: true,
      contact: true,
      location: true,
    },
  });
}

export type CategoryBreakdownRow = {
  categoryId: number | null;
  name: string;
  total: number;
  count: number;
};

// Sum a single type's transactions grouped by category within a date range,
// sorted by total descending. Used by the Stats screen.
export async function getCategoryBreakdown(
  db: Db,
  userId: string,
  type: "income" | "expense",
  from: Date,
  to: Date,
): Promise<{ rows: CategoryBreakdownRow[]; total: number }> {
  const txns = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      isNull(transactionsTable.deletedAt),
      eq(transactionsTable.type, type),
      gte(transactionsTable.date, from),
      lte(transactionsTable.date, to),
    ),
    with: { category: true },
  });

  const grouped = new Map<number | null, CategoryBreakdownRow>();
  let total = 0;

  for (const tx of txns) {
    total += tx.amount;
    const cat = tx.category;
    const key = cat?.id ?? null;
    const existing = grouped.get(key);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      grouped.set(key, {
        categoryId: key,
        name: cat?.name ?? "Uncategorized",
        total: tx.amount,
        count: 1,
      });
    }
  }

  const rows = Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  return { rows, total };
}

export async function getTransactionsSummary(db: Db, userId: string, from: Date, to: Date) {
  const result = await db
    .select({
      type: transactionsTable.type,
      total: sql<number>`sum(${transactionsTable.amount})`.as("total"),
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        isNull(transactionsTable.deletedAt),
        gte(transactionsTable.date, from),
        lte(transactionsTable.date, to),
      ),
    )
    .groupBy(transactionsTable.type);

  let income = 0;
  let expense = 0;
  for (const row of result) {
    if (row.type === "income") income = row.total;
    if (row.type === "expense") expense = row.total;
  }

  return { income, expense, net: income - expense };
}

export type MonthlySummary = { income: number; expense: number; net: number };

// Per-month income/expense/net totals for a calendar year, in a single read.
// Buckets in JS to avoid depending on the stored date's unit (drives the
// Monthly tab, which previously fired one summary query per month).
export async function getMonthlySummary(
  db: Db,
  userId: string,
  year: number,
): Promise<MonthlySummary[]> {
  const from = new Date(year, 0, 1, 0, 0, 0, 0);
  const to = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await db.query.transactionsTable.findMany({
    where: and(
      eq(transactionsTable.userId, userId),
      isNull(transactionsTable.deletedAt),
      gte(transactionsTable.date, from),
      lte(transactionsTable.date, to),
    ),
    columns: { type: true, amount: true, date: true },
  });

  const months: MonthlySummary[] = Array.from({ length: 12 }, () => ({
    income: 0,
    expense: 0,
    net: 0,
  }));

  for (const r of rows) {
    const d = r.date instanceof Date ? r.date : new Date(r.date as number);
    const m = months[d.getMonth()];
    if (!m) continue;
    if (r.type === "income") m.income += r.amount;
    else if (r.type === "expense") m.expense += r.amount;
  }
  for (const m of months) m.net = m.income - m.expense;

  return months;
}

export async function createTransaction(db: Db, userId: string, payload: CreateTransactionPayload) {
  const { contactIds, ...data } = payload;

  const [transaction] = await db
    .insert(transactionsTable)
    .values({
      id: generateSyncId(),
      userId,
      type: data.type,
      amount: data.amount,
      fee: data.fee ?? 0,
      categoryId: data.categoryId ?? null,
      accountId: data.accountId,
      toAccountId: data.toAccountId ?? null,
      contactId: data.contactId ?? null,
      dueDate: data.dueDate != null ? new Date(data.dueDate) : null,
      locationId: data.locationId ?? null,
      note: data.note ?? null,
      date: new Date(data.date),
    })
    .returning();

  if (contactIds?.length && transaction) {
    for (const contactId of contactIds) {
      await db
        .insert(transactionContactsTable)
        .values({ transactionId: transaction.id, contactId });
    }
  }

  return transaction;
}

export async function updateTransaction(db: Db, userId: string, id: number, payload: UpdateTransactionPayload) {
  const { contactIds, ...data } = payload;

  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.type !== undefined) setData.type = data.type;
  if (data.amount !== undefined) setData.amount = data.amount;
  if (data.fee !== undefined) setData.fee = data.fee;
  if (data.categoryId !== undefined) setData.categoryId = data.categoryId;
  if (data.accountId !== undefined) setData.accountId = data.accountId;
  if (data.toAccountId !== undefined) setData.toAccountId = data.toAccountId;
  if (data.contactId !== undefined) setData.contactId = data.contactId;
  if (data.dueDate !== undefined)
    setData.dueDate = data.dueDate != null ? new Date(data.dueDate) : null;
  if (data.locationId !== undefined) setData.locationId = data.locationId;
  if (data.note !== undefined) setData.note = data.note;
  if (data.date !== undefined) setData.date = new Date(data.date);

  const [transaction] = await db
    .update(transactionsTable)
    .set(setData)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .returning();

  if (contactIds !== undefined) {
    await db
      .delete(transactionContactsTable)
      .where(eq(transactionContactsTable.transactionId, id));

    for (const contactId of contactIds) {
      await db
        .insert(transactionContactsTable)
        .values({ transactionId: id, contactId });
    }
  }

  return transaction;
}

// Soft delete: tombstone the row so the deletion syncs and can't resurrect on
// the next pull. Reads filter `deletedAt IS NULL`.
export async function deleteTransaction(db: Db, userId: string, id: number) {
  await db
    .update(transactionsTable)
    .set({ deletedAt: Date.now(), updatedAt: new Date() })
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));

  // If this transaction is a recurring template, cancel its rule too. Otherwise
  // the rule keeps pointing at the tombstoned template and would regenerate it
  // (and it would linger on the Recurring screen). Deleting a materialized clone
  // is unaffected — clones aren't a rule's transactionId.
  await db
    .update(recurringRulesTable)
    .set({ deletedAt: Date.now(), updatedAt: new Date() })
    .where(
      and(
        eq(recurringRulesTable.transactionId, id),
        eq(recurringRulesTable.userId, userId),
      ),
    );
}
