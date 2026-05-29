import { eq, and } from "drizzle-orm";
import { accountsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";

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
