import { eq, and } from "drizzle-orm";
import { accountsTable } from "@shareef-money/db/schema";
import type { AccountCreatePayload, AccountUpdatePayload } from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export function list(db: AppDatabase, userId: string) {
  return db
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.userId, userId), eq(accountsTable.isArchived, false)))
    .orderBy(accountsTable.sortOrder)
    .all();
}

export function getById(db: AppDatabase, userId: string, id: number) {
  const account = db
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .get();

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
