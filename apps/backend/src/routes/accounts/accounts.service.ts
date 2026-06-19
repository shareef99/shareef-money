import { eq, and } from "drizzle-orm";
import { accountsTable } from "@shareef-money/db/schema";
import type { AccountCreatePayload, AccountUpdatePayload } from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export async function list(db: AppDatabase, userId: string) {
  return db
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.userId, userId), eq(accountsTable.isArchived, false)))
    .orderBy(accountsTable.sortOrder)
    .all();
}

export async function getById(db: AppDatabase, userId: string, id: number) {
  const account = await db
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .get();

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  return account;
}

export async function create(db: AppDatabase, userId: string, payload: AccountCreatePayload) {
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

export async function update(db: AppDatabase, userId: string, id: number, payload: AccountUpdatePayload) {
  await getById(db, userId, id);

  return db
    .update(accountsTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .returning()
    .get();
}

export async function archive(db: AppDatabase, userId: string, id: number) {
  await getById(db, userId, id);

  await db
    .update(accountsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .run();
}
