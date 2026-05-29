import { eq, and } from "drizzle-orm";
import { accountsTable, type Account } from "@shareef-money/db/schema";
import type { AccountCreatePayload, AccountUpdatePayload } from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export function list(db: AppDatabase, userId: string): Account[] {
  return db.query.accountsTable.findMany({
    where: and(eq(accountsTable.userId, userId), eq(accountsTable.isArchived, false)),
    orderBy: accountsTable.sortOrder,
  }) as unknown as Account[];
}

export function getById(db: AppDatabase, userId: string, id: number): Account {
  const account = db.query.accountsTable.findFirst({
    where: and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)),
  }) as unknown as Account | undefined;

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  return account;
}

export function create(db: AppDatabase, userId: string, payload: AccountCreatePayload) {
  return db
    .insert(accountsTable)
    .values({
      userId,
      name: payload.name,
      initialBalance: payload.initialBalance ?? 0,
      description: payload.description ?? null,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .returning()
    .get();
}

export function update(db: AppDatabase, userId: string, id: number, payload: AccountUpdatePayload) {
  getById(db, userId, id);

  return db
    .update(accountsTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .returning()
    .get();
}

export function archive(db: AppDatabase, userId: string, id: number) {
  getById(db, userId, id);

  db.update(accountsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .run();
}
