import { eq, and, desc } from "drizzle-orm";
import { accountsTable, transactionsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";
import { getOrCreateOpeningBalanceCategory } from "./category-service";

export async function getAccounts(db: Db, userId: string) {
  return db.query.accountsTable.findMany({
    where: and(eq(accountsTable.userId, userId), eq(accountsTable.isArchived, false)),
    orderBy: accountsTable.sortOrder,
  });
}

export async function getAccountById(db: Db, userId: string, id: number) {
  return db.query.accountsTable.findFirst({
    where: and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)),
  });
}

export type AccountWithBalance = Awaited<
  ReturnType<typeof getAccounts>
>[number] & { balance: number };

// Balance = initialBalance + incomes − expenses + transfers in − (transfers out + fees)
export async function getAccountsWithBalances(
  db: Db,
  userId: string,
): Promise<{ accounts: AccountWithBalance[]; total: number }> {
  const accounts = await getAccounts(db, userId);

  const txns = await db.query.transactionsTable.findMany({
    where: eq(transactionsTable.userId, userId),
    columns: {
      type: true,
      amount: true,
      fee: true,
      accountId: true,
      toAccountId: true,
    },
  });

  const delta = new Map<number, number>();
  const add = (id: number | null, value: number) => {
    if (id == null) return;
    delta.set(id, (delta.get(id) ?? 0) + value);
  };

  for (const t of txns) {
    if (t.type === "income") add(t.accountId, t.amount);
    else if (t.type === "expense") add(t.accountId, -t.amount);
    else if (t.type === "transfer") {
      add(t.accountId, -(t.amount + t.fee));
      add(t.toAccountId, t.amount);
    }
  }

  const withBalances = accounts.map((a) => ({
    ...a,
    balance: a.initialBalance + (delta.get(a.id) ?? 0),
  }));

  const total = withBalances.reduce((s, a) => s + a.balance, 0);
  return { accounts: withBalances, total };
}

type CreateAccountPayload = {
  name: string;
  initialBalance?: number;
  description?: string | null;
};

type UpdateAccountPayload = {
  name?: string;
  initialBalance?: number;
  description?: string | null;
};

export async function createAccount(db: Db, userId: string, payload: CreateAccountPayload) {
  const last = await db.query.accountsTable.findMany({
    where: eq(accountsTable.userId, userId),
    orderBy: desc(accountsTable.sortOrder),
    limit: 1,
  });
  const nextSortOrder = (last[0]?.sortOrder ?? -1) + 1;

  const opening = payload.initialBalance ?? 0;

  // The opening amount is recorded as an income transaction (see below), so the
  // account's stored initialBalance stays 0 to avoid double-counting it in the
  // balance.
  const [account] = await db
    .insert(accountsTable)
    .values({
      id: generateSyncId(),
      userId,
      name: payload.name,
      initialBalance: 0,
      description: payload.description ?? null,
      sortOrder: nextSortOrder,
    })
    .returning();

  if (opening > 0 && account) {
    const category = await getOrCreateOpeningBalanceCategory(db, userId);
    await db.insert(transactionsTable).values({
      id: generateSyncId(),
      userId,
      type: "income",
      amount: opening,
      fee: 0,
      categoryId: category.id,
      accountId: account.id,
      toAccountId: null,
      locationId: null,
      note: "Opening balance",
      description: null,
      date: new Date(),
    });
  }

  return account;
}

export async function updateAccount(db: Db, userId: string, id: number, payload: UpdateAccountPayload) {
  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (payload.name !== undefined) setData.name = payload.name;
  if (payload.initialBalance !== undefined) setData.initialBalance = payload.initialBalance;
  if (payload.description !== undefined) setData.description = payload.description;

  const [account] = await db
    .update(accountsTable)
    .set(setData)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .returning();

  return account;
}

export async function archiveAccount(db: Db, userId: string, id: number) {
  await db
    .update(accountsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)));
}

export async function reorderAccounts(db: Db, userId: string, orderedIds: number[]) {
  const updatedAt = new Date();
  for (const [index, id] of orderedIds.entries()) {
    await db
      .update(accountsTable)
      .set({ sortOrder: index, updatedAt })
      .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)));
  }
}
