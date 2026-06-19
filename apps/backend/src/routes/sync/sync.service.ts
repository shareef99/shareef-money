import { eq, and, gt } from "drizzle-orm";
import {
  accountsTable,
  categoriesTable,
  contactsTable,
  locationsTable,
  transactionsTable,
  transactionContactsTable,
  recurringRulesTable,
  settingsTable,
  syncLogTable,
} from "@shareef-money/db/schema";
import type { AppDatabase } from "../../db.js";
import type { SyncPushInput, SyncAckInput } from "@shareef-money/shared/validation";

export async function push(db: AppDatabase, userId: string, input: SyncPushInput) {
  const results: Array<{ table: string; action: string; id: unknown; status: string }> = [];

  for (const change of input.changes) {
    try {
      await applyChange(db, userId, change, results);
    } catch (error) {
      console.error(`Sync push failed for ${change.table}:`, error);
      results.push({
        table: change.table,
        action: change.action,
        id: (change.data as Record<string, unknown>).id ?? null,
        status: "error",
      });
    }
  }

  return results;
}

async function applyChange(
  db: AppDatabase,
  userId: string,
  change: SyncPushInput["changes"][number],
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  const data = change.data as Record<string, any>;

  if (change.table === "settings") {
    const key = data.key as string;
    const value = data.value as string;

    const existing = await db
      .select()
      .from(settingsTable)
      .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)))
      .get();

    if (existing) {
      await db
        .update(settingsTable)
        .set({ value })
        .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)))
        .run();
    } else {
      await db.insert(settingsTable).values({ userId, key, value }).run();
    }
    results.push({ table: "settings", action: "upserted", id: key, status: "ok" });
    return;
  }

  if (change.table === "transaction_contacts") {
    const txId = data.transactionId as number;
    const contactId = data.contactId as number;
    if (change.action === "delete") {
      await db
        .delete(transactionContactsTable)
        .where(
          and(
            eq(transactionContactsTable.transactionId, txId),
            eq(transactionContactsTable.contactId, contactId),
          ),
        )
        .run();
    } else {
      await db
        .insert(transactionContactsTable)
        .values({ transactionId: txId, contactId })
        .onConflictDoNothing()
        .run();
    }
    results.push({ table: "transaction_contacts", action: change.action, id: `${txId}-${contactId}`, status: "ok" });
    return;
  }

  if (change.table === "recurring_rules") {
    await handleRecurringSync(db, userId, data.id as number, change, data, results);
    return;
  }

  const id = data.id as number;

  if (change.table === "accounts") {
    await handleTableSync(db, accountsTable, userId, id, change, data, results);
  } else if (change.table === "categories") {
    await handleTableSync(db, categoriesTable, userId, id, change, data, results);
  } else if (change.table === "contacts") {
    await handleTableSync(db, contactsTable, userId, id, change, data, results);
  } else if (change.table === "locations") {
    await handleTableSync(db, locationsTable, userId, id, change, data, results);
  } else if (change.table === "transactions") {
    await handleTransactionSync(db, userId, id, change, data, results);
  }
}

async function handleTableSync(
  db: AppDatabase,
  table: any,
  userId: string,
  id: number,
  change: { action: string; updatedAt: number; table: string },
  data: Record<string, any>,
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  if (change.action === "delete") {
    await db
      .update(table)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(table.id, id), eq(table.userId, userId)))
      .run();
    results.push({ table: change.table, action: "archived", id, status: "ok" });
    return;
  }

  const existing = await db.select().from(table).where(and(eq(table.id, id), eq(table.userId, userId))).get();

  if (existing) {
    const existingTs = existing.updatedAt instanceof Date
      ? existing.updatedAt.getTime()
      : (existing.updatedAt as number);

    if (change.updatedAt > existingTs) {
      const updateData: any = { ...data, userId, updatedAt: new Date(change.updatedAt) };
      delete updateData.id;
      delete updateData.createdAt;
      await db.update(table).set(updateData).where(and(eq(table.id, id), eq(table.userId, userId))).run();
      results.push({ table: change.table, action: "updated", id, status: "ok" });
    } else {
      results.push({ table: change.table, action: "skipped", id, status: "server_newer" });
    }
  } else {
    await db
      .insert(table)
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

async function handleTransactionSync(
  db: AppDatabase,
  userId: string,
  id: number,
  change: { action: string; updatedAt: number; table: string },
  data: Record<string, any>,
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  if (change.action === "delete") {
    await db
      .delete(transactionsTable)
      .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
      .run();
    results.push({ table: "transactions", action: "deleted", id, status: "ok" });
    return;
  }

  const existing = await db
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
      await db
        .update(transactionsTable)
        .set(updateData)
        .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
        .run();
      results.push({ table: "transactions", action: "updated", id, status: "ok" });
    } else {
      results.push({ table: "transactions", action: "skipped", id, status: "server_newer" });
    }
  } else {
    await db
      .insert(transactionsTable)
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

async function handleRecurringSync(
  db: AppDatabase,
  userId: string,
  id: number,
  change: { action: string; updatedAt: number; table: string },
  data: Record<string, any>,
  results: Array<{ table: string; action: string; id: unknown; status: string }>,
) {
  if (change.action === "delete") {
    await db
      .delete(recurringRulesTable)
      .where(and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, userId)))
      .run();
    results.push({ table: "recurring_rules", action: "deleted", id, status: "ok" });
    return;
  }

  const values = {
    ...data,
    userId,
    startDate: new Date(data.startDate as number),
    endDate: data.endDate != null ? new Date(data.endDate as number) : null,
    nextOccurrence: new Date(data.nextOccurrence as number),
    createdAt: new Date(data.createdAt as number),
    updatedAt: new Date(change.updatedAt),
  };

  const existing = await db
    .select()
    .from(recurringRulesTable)
    .where(and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, userId)))
    .get();

  if (existing) {
    const existingTs =
      existing.updatedAt instanceof Date
        ? existing.updatedAt.getTime()
        : (existing.updatedAt as number);

    if (change.updatedAt > existingTs) {
      const updateData: any = { ...values };
      delete updateData.id;
      delete updateData.createdAt;
      await db
        .update(recurringRulesTable)
        .set(updateData)
        .where(and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, userId)))
        .run();
      results.push({ table: "recurring_rules", action: "updated", id, status: "ok" });
    } else {
      results.push({ table: "recurring_rules", action: "skipped", id, status: "server_newer" });
    }
  } else {
    await db.insert(recurringRulesTable).values(values as any).run();
    results.push({ table: "recurring_rules", action: "created", id, status: "ok" });
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

export async function pull(
  db: AppDatabase,
  userId: string,
  lastSyncAt: number,
  tables?: string[],
) {
  const since = new Date(lastSyncAt);
  const result: Record<string, unknown[]> = {};

  const shouldInclude = (name: string) => !tables?.length || tables.includes(name);

  if (shouldInclude("accounts")) {
    result.accounts = (
      await db
        .select().from(accountsTable)
        .where(and(eq(accountsTable.userId, userId), gt(accountsTable.updatedAt, since)))
        .all()
    ).map(serializeRow);
  }

  if (shouldInclude("categories")) {
    result.categories = (
      await db
        .select().from(categoriesTable)
        .where(and(eq(categoriesTable.userId, userId), gt(categoriesTable.updatedAt, since)))
        .all()
    ).map(serializeRow);
  }

  if (shouldInclude("contacts")) {
    result.contacts = (
      await db
        .select().from(contactsTable)
        .where(and(eq(contactsTable.userId, userId), gt(contactsTable.updatedAt, since)))
        .all()
    ).map(serializeRow);
  }

  if (shouldInclude("locations")) {
    result.locations = (
      await db
        .select().from(locationsTable)
        .where(and(eq(locationsTable.userId, userId), gt(locationsTable.updatedAt, since)))
        .all()
    ).map(serializeRow);
  }

  if (shouldInclude("transactions")) {
    result.transactions = (
      await db
        .select().from(transactionsTable)
        .where(and(eq(transactionsTable.userId, userId), gt(transactionsTable.updatedAt, since)))
        .all()
    ).map(serializeRow);
  }

  if (shouldInclude("recurring_rules")) {
    result.recurring_rules = (
      await db
        .select().from(recurringRulesTable)
        .where(and(eq(recurringRulesTable.userId, userId), gt(recurringRulesTable.updatedAt, since)))
        .all()
    ).map((row) => ({
      ...row,
      startDate: row.startDate instanceof Date ? row.startDate.getTime() : row.startDate,
      endDate: row.endDate instanceof Date ? row.endDate.getTime() : row.endDate,
      nextOccurrence:
        row.nextOccurrence instanceof Date
          ? row.nextOccurrence.getTime()
          : row.nextOccurrence,
      createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : row.updatedAt,
    }));
  }

  if (shouldInclude("settings")) {
    result.settings = await db
      .select().from(settingsTable)
      .where(eq(settingsTable.userId, userId))
      .all();
  }

  if (shouldInclude("transaction_contacts")) {
    result.transaction_contacts = await db
      .select().from(transactionContactsTable)
      .all();
  }

  return result;
}

export async function ack(db: AppDatabase, userId: string, input: SyncAckInput) {
  const syncedAt = new Date(input.syncedAt);
  const tableNames = ["accounts", "categories", "contacts", "locations", "transactions", "recurring_rules", "settings", "transaction_contacts"];

  for (const tableName of tableNames) {
    const existing = await db
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
      await db
        .update(syncLogTable)
        .set({ lastSyncAt: syncedAt })
        .where(eq(syncLogTable.id, existing.id))
        .run();
    } else {
      await db
        .insert(syncLogTable)
        .values({ userId, deviceId: input.deviceId, tableName, lastSyncAt: syncedAt })
        .run();
    }
  }
}

export async function status(db: AppDatabase, userId: string, deviceId: string) {
  return (
    await db
      .select()
      .from(syncLogTable)
      .where(and(eq(syncLogTable.userId, userId), eq(syncLogTable.deviceId, deviceId)))
      .all()
  ).map((log) => ({
    ...log,
    lastSyncAt: log.lastSyncAt instanceof Date ? log.lastSyncAt.getTime() : log.lastSyncAt,
    createdAt: log.createdAt instanceof Date ? log.createdAt.getTime() : log.createdAt,
  }));
}
