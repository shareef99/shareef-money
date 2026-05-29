import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { transactionsTable, transactionContactsTable } from "@shareef-money/db/schema";
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
  TransactionFilters,
} from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export function list(db: AppDatabase, userId: string, filters: TransactionFilters) {
  const conditions = [eq(transactionsTable.userId, userId)];

  if (filters.type) {
    conditions.push(eq(transactionsTable.type, filters.type));
  }
  if (filters.dateFrom) {
    conditions.push(gte(transactionsTable.date, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(transactionsTable.date, new Date(filters.dateTo)));
  }
  if (filters.accountIds?.length) {
    conditions.push(inArray(transactionsTable.accountId, filters.accountIds));
  }
  if (filters.categoryIds?.length) {
    conditions.push(inArray(transactionsTable.categoryId, filters.categoryIds));
  }

  return db.query.transactionsTable.findMany({
    where: and(...conditions),
    orderBy: desc(transactionsTable.date),
    limit: filters.limit,
    offset: filters.offset,
    with: {
      category: true,
      account: true,
    },
  }) as unknown as any[];
}

export function getById(db: AppDatabase, userId: string, id: number) {
  const transaction = db.query.transactionsTable.findFirst({
    where: and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
    with: {
      category: true,
      account: true,
      transactionContacts: true,
    },
  }) as unknown as Record<string, unknown> | undefined;

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return transaction;
}

export function create(db: AppDatabase, userId: string, payload: TransactionCreateInput) {
  const { contactIds, ...transactionData } = payload;

  const transaction = db
    .insert(transactionsTable)
    .values({
      userId,
      type: transactionData.type,
      amount: transactionData.amount,
      fee: "fee" in transactionData ? transactionData.fee : 0,
      categoryId: "categoryId" in transactionData ? transactionData.categoryId : null,
      accountId: transactionData.accountId,
      toAccountId: "toAccountId" in transactionData ? transactionData.toAccountId : null,
      locationId: transactionData.locationId ?? null,
      note: transactionData.note ?? null,
      description: transactionData.description ?? null,
      date: new Date(transactionData.date),
    })
    .returning()
    .get();

  if (contactIds?.length) {
    for (const contactId of contactIds) {
      db.insert(transactionContactsTable)
        .values({ transactionId: transaction.id, contactId })
        .run();
    }
  }

  return transaction;
}

export function update(db: AppDatabase, userId: string, id: number, payload: TransactionUpdateInput) {
  const existing = db.query.transactionsTable.findFirst({
    where: and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
  }) as any;

  if (!existing) {
    throw new AppError("Transaction not found", 404);
  }

  const { contactIds, ...updateData } = payload;

  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (updateData.type !== undefined) setData.type = updateData.type;
  if (updateData.amount !== undefined) setData.amount = updateData.amount;
  if (updateData.fee !== undefined) setData.fee = updateData.fee;
  if (updateData.categoryId !== undefined) setData.categoryId = updateData.categoryId;
  if (updateData.accountId !== undefined) setData.accountId = updateData.accountId;
  if (updateData.toAccountId !== undefined) setData.toAccountId = updateData.toAccountId;
  if (updateData.locationId !== undefined) setData.locationId = updateData.locationId;
  if (updateData.note !== undefined) setData.note = updateData.note;
  if (updateData.description !== undefined) setData.description = updateData.description;
  if (updateData.date !== undefined) setData.date = new Date(updateData.date);

  const transaction = db
    .update(transactionsTable)
    .set(setData)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .returning()
    .get();

  if (contactIds !== undefined) {
    db.delete(transactionContactsTable)
      .where(eq(transactionContactsTable.transactionId, id))
      .run();

    for (const contactId of contactIds) {
      db.insert(transactionContactsTable)
        .values({ transactionId: id, contactId })
        .run();
    }
  }

  return transaction;
}

export function archive(db: AppDatabase, userId: string, id: number) {
  const existing = db.query.transactionsTable.findFirst({
    where: and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)),
  }) as any;

  if (!existing) {
    throw new AppError("Transaction not found", 404);
  }

  db.delete(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .run();
}
