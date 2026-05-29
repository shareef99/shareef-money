import { eq, and, gt } from "drizzle-orm";
import {
  accountsTable,
  categoriesTable,
  contactsTable,
  locationsTable,
  transactionsTable,
  transactionContactsTable,
  settingsTable,
  syncLogTable,
} from "@shareef-money/db/schema";
import type { AppDatabase } from "../../db.js";
import type { SyncPushInput, SyncAckInput } from "@shareef-money/shared/validation";

export function push(db: AppDatabase, userId: string, input: SyncPushInput) {
  const results: Array<{ table: string; action: string; id: unknown; status: string }> = [];

  for (const change of input.changes) {
    const data = change.data as Record<string, any>;

    if (change.table === "settings") {
      const key = data.key as string;
      const value = data.value as string;

      const existing = db
        .select()
        .from(settingsTable)
        .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)))
        .get();

      if (existing) {
        db.update(settingsTable)
          .set({ value })
          .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)))
          .run();
      } else {
        db.insert(settingsTable).values({ userId, key, value }).run();
      }
      results.push({ table: "settings", action: "upserted", id: key, status: "ok" });
      continue;
    }

    if (change.table === "transaction_contacts") {
      const txId = data.transactionId as number;
      const contactId = data.contactId as number;
      if (change.action === "delete") {
        db.delete(transactionContactsTable)
          .where(
            and(
              eq(transactionContactsTable.transactionId, txId),
              eq(transactionContactsTable.contactId, contactId),
            ),
          )
          .run();
      } else {
        db.insert(transactionContactsTable)
          .values({ transactionId: txId, contactId })
          .onConflictDoNothing()
          .run();
      }
      results.push({ table: "transaction_contacts", action: change.action, id: `${txId}-${contactId}`, status: "ok" });
      continue;
    }

    const id = data.id as number;

    if (change.table === "accounts") {
      handleTableSync(db, accountsTable, userId, id, change, data, results);
    } else if (change.table === "categories") {
      handleTableSync(db, categoriesTable, userId, id, change, data, results);
    } else if (change.table === "contacts") {
      handleTableSync(db, contactsTable, userId, id, change, data, results);
    } else if (change.table === "locations") {
      handleTableSync(db, locationsTable, userId, id, change, data, results);
    } else if (change.table === "transactions") {
      handleTransactionSync(db, userId, id, change, data, results);
    }
  }

  return results;
}

function handleTableSync(
  db: AppDatabase,
  table: any,
  userId: string,
  id: number,
  change: { action: string; updatedAt: number; table: string },
  data: Record<string, any>,
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  if (change.action === "delete") {
    db.update(table)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.userId, userId)))
      .run();
    results.push({ table: change.table, action: "archived", id, status: "ok" });
    return;
  }

  const existing = db.select().from(table).where(and(eq(table.id, id), eq(table.userId, userId))).get();

  if (existing) {
    const existingTs = existing.updatedAt instanceof Date
      ? existing.updatedAt.getTime()
      : (existing.updatedAt as number);

    if (change.updatedAt > existingTs) {
      const updateData: any = { ...data, userId, updatedAt: new Date(change.updatedAt) };
      delete updateData.id;
      delete updateData.createdAt;
      db.update(table).set(updateData).where(and(eq(table.id, id), eq(table.userId, userId))).run();
      results.push({ table: change.table, action: "updated", id, status: "ok" });
    } else {
      results.push({ table: change.table, action: "skipped", id, status: "server_newer" });
    }
  } else {
    db.insert(table)
      .values({
        ...data,
        userId,
        createdAt: new Date(data.createdAt as number),
        updatedAt: new Date(change.updatedAt),
      } as any)
      .run();
    results.push({ table: change.table, action: "created", id, status: "ok" });
  }
}

function handleTransactionSync(
  db: AppDatabase,
  userId: string,
  id: number,
  change: { action: string; updatedAt: number; table: string },
  data: Record<string, any>,
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  if (change.action === "delete") {
    db.delete(transactionsTable)
      .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
      .run();
    results.push({ table: "transactions", action: "deleted", id, status: "ok" });
    return;
  }

  const existing = db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .get();

  if (existing) {
    const existingTs = existing.updatedAt instanceof Date
      ? existing.updatedAt.getTime()
      : (existing.updatedAt as number);

    if (change.updatedAt > existingTs) {
      const updateData: any = {
        ...data,
        userId,
        date: new Date(data.date as number),
        updatedAt: new Date(change.updatedAt),
      };
      delete updateData.id;
      delete updateData.createdAt;
      db.update(transactionsTable)
        .set(updateData)
        .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
        .run();
      results.push({ table: "transactions", action: "updated", id, status: "ok" });
    } else {
      results.push({ table: "transactions", action: "skipped", id, status: "server_newer" });
    }
  } else {
    db.insert(transactionsTable)
      .values({
        ...data,
        userId,
        date: new Date(data.date as number),
        createdAt: new Date(data.createdAt as number),
        updatedAt: new Date(change.updatedAt),
      } as any)
      .run();
    results.push({ table: "transactions", action: "created", id, status: "ok" });
  }
}

function serializeRow(row: Record<string, any>) {
  return {
    ...row,
    date: row.date instanceof Date ? row.date.getTime() : row.date,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : row.updatedAt,
  };
}

export function pull(
  db: AppDatabase,
  userId: string,
  lastSyncAt: number,
  tables?: string[],
) {
  const since = new Date(lastSyncAt);
  const result: Record<string, unknown[]> = {};

  const shouldInclude = (name: string) => !tables?.length || tables.includes(name);

  if (shouldInclude("accounts")) {
    result.accounts = db
      .select().from(accountsTable)
      .where(and(eq(accountsTable.userId, userId), gt(accountsTable.updatedAt, since)))
      .all().map(serializeRow);
  }

  if (shouldInclude("categories")) {
    result.categories = db
      .select().from(categoriesTable)
      .where(and(eq(categoriesTable.userId, userId), gt(categoriesTable.updatedAt, since)))
      .all().map(serializeRow);
  }

  if (shouldInclude("contacts")) {
    result.contacts = db
      .select().from(contactsTable)
      .where(and(eq(contactsTable.userId, userId), gt(contactsTable.updatedAt, since)))
      .all().map(serializeRow);
  }

  if (shouldInclude("locations")) {
    result.locations = db
      .select().from(locationsTable)
      .where(and(eq(locationsTable.userId, userId), gt(locationsTable.updatedAt, since)))
      .all().map(serializeRow);
  }

  if (shouldInclude("transactions")) {
    result.transactions = db
      .select().from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), gt(transactionsTable.updatedAt, since)))
      .all().map(serializeRow);
  }

  if (shouldInclude("settings")) {
    result.settings = db
      .select().from(settingsTable)
      .where(eq(settingsTable.userId, userId))
      .all();
  }

  if (shouldInclude("transaction_contacts")) {
    result.transaction_contacts = db
      .select().from(transactionContactsTable)
      .all();
  }

  return result;
}

export function ack(db: AppDatabase, userId: string, input: SyncAckInput) {
  const syncedAt = new Date(input.syncedAt);
  const tableNames = ["accounts", "categories", "contacts", "locations", "transactions", "settings", "transaction_contacts"];

  for (const tableName of tableNames) {
    const existing = db
      .select()
      .from(syncLogTable)
      .where(
        and(
          eq(syncLogTable.userId, userId),
          eq(syncLogTable.deviceId, input.deviceId),
          eq(syncLogTable.tableName, tableName),
        ),
      )
      .get();

    if (existing) {
      db.update(syncLogTable)
        .set({ lastSyncAt: syncedAt })
        .where(eq(syncLogTable.id, existing.id))
        .run();
    } else {
      db.insert(syncLogTable)
        .values({ userId, deviceId: input.deviceId, tableName, lastSyncAt: syncedAt })
        .run();
    }
  }
}

export function status(db: AppDatabase, userId: string, deviceId: string) {
  return db
    .select()
    .from(syncLogTable)
    .where(and(eq(syncLogTable.userId, userId), eq(syncLogTable.deviceId, deviceId)))
    .all()
    .map((log) => ({
      ...log,
      lastSyncAt: log.lastSyncAt instanceof Date ? log.lastSyncAt.getTime() : log.lastSyncAt,
      createdAt: log.createdAt instanceof Date ? log.createdAt.getTime() : log.createdAt,
    }));
}
