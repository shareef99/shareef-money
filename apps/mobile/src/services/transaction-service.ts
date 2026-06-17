import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import {
  transactionsTable,
  transactionContactsTable,
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
  locationId?: number | null;
  contactIds?: number[];
  note?: string | null;
  description?: string | null;
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
  const conditions = [eq(transactionsTable.userId, userId)];

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
      transactionContacts: true,
    },
  });
}

export async function getTransactionsByDateRange(db: Db, userId: string, from: Date, to: Date) {
  return getTransactions(db, userId, { dateFrom: from, dateTo: to });
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
      locationId: data.locationId ?? null,
      note: data.note ?? null,
      description: data.description ?? null,
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
  if (data.locationId !== undefined) setData.locationId = data.locationId;
  if (data.note !== undefined) setData.note = data.note;
  if (data.description !== undefined) setData.description = data.description;
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

export async function deleteTransaction(db: Db, userId: string, id: number) {
  await db
    .delete(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));
}
