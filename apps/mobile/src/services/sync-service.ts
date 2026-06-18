import { gt, eq } from "drizzle-orm";
import {
  accountsTable,
  categoriesTable,
  contactsTable,
  locationsTable,
  transactionsTable,
  recurringRulesTable,
  settingsTable,
} from "@shareef-money/db/schema";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import type { Db } from "../db/client";
import type { AxiosInstance } from "axios";

const LAST_SYNC_KEY = "last_sync_at";
const DEVICE_ID_KEY = "device_id";

const toMs = (v: unknown): number =>
  v instanceof Date ? v.getTime() : (v as number);

export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function getLastSyncAt(): Promise<number> {
  const val = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  return val ? Number(val) : 0;
}

export async function setLastSyncAt(timestamp: number): Promise<void> {
  await SecureStore.setItemAsync(LAST_SYNC_KEY, String(timestamp));
}

const syncableTables = {
  accounts: accountsTable,
  categories: categoriesTable,
  contacts: contactsTable,
  locations: locationsTable,
  transactions: transactionsTable,
} as const;

export async function pullChanges(db: Db, api: AxiosInstance, userId: string) {
  const lastSyncAt = await getLastSyncAt();

  const { data } = await api.post<{
    changes: Record<string, Array<Record<string, unknown>>>;
    syncedAt: number;
  }>("/sync/pull", { lastSyncAt });

  for (const [tableName, rows] of Object.entries(data.changes)) {
    if (!rows?.length) continue;

    if (tableName === "settings") {
      for (const row of rows) {
        const key = row.key as string;
        const value = row.value as string;

        const existing = db
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.key, key))
          .get();

        if (existing) {
          db.update(settingsTable)
            .set({ value })
            .where(eq(settingsTable.key, key))
            .run();
        } else {
          db.insert(settingsTable)
            .values({ userId, key, value })
            .run();
        }
      }
      continue;
    }

    if (tableName === "recurring_rules") {
      for (const row of rows) {
        const id = row.id as number;
        const data = {
          ...row,
          userId,
          startDate: new Date(row.startDate as number),
          endDate: row.endDate != null ? new Date(row.endDate as number) : null,
          nextOccurrence: new Date(row.nextOccurrence as number),
          isActive: !!row.isActive,
          createdAt: new Date(row.createdAt as number),
          updatedAt: new Date(row.updatedAt as number),
        };

        const existing = db
          .select({ id: recurringRulesTable.id })
          .from(recurringRulesTable)
          .where(eq(recurringRulesTable.id, id))
          .get();

        if (existing) {
          const updateData = { ...data } as Record<string, unknown>;
          delete updateData.id;
          delete updateData.createdAt;
          db.update(recurringRulesTable)
            .set(updateData)
            .where(eq(recurringRulesTable.id, id))
            .run();
        } else {
          // Date/boolean fields are already coerced above; the spread of the
          // wire row widens the type, so cast like the other sync inserts.
          db.insert(recurringRulesTable)
            .values(data as never)
            .run();
        }
      }
      continue;
    }

    const table = syncableTables[tableName as keyof typeof syncableTables];
    if (!table) continue;

    for (const row of rows) {
      const id = row.id as number;
      const rowData: Record<string, unknown> = {
        ...row,
        userId,
        date: row.date ? new Date(row.date as number) : undefined,
        createdAt: new Date(row.createdAt as number),
        updatedAt: new Date(row.updatedAt as number),
      };
      if (!rowData.date) delete rowData.date;

      const existing = db
        .select({ id: (table as typeof accountsTable).id })
        .from(table as typeof accountsTable)
        .where(eq((table as typeof accountsTable).id, id))
        .get();

      if (existing) {
        const updateData: Record<string, unknown> = { ...rowData };
        delete updateData.id;
        delete updateData.createdAt;

        db.update(table as typeof accountsTable)
          .set(updateData as never)
          .where(eq((table as typeof accountsTable).id, id))
          .run();
      } else {
        db.insert(table as typeof accountsTable)
          .values(rowData as never)
          .run();
      }
    }
  }

  await setLastSyncAt(data.syncedAt);
  return data.syncedAt;
}

export async function pushChanges(db: Db, api: AxiosInstance) {
  const lastSyncAt = await getLastSyncAt();
  const since = new Date(lastSyncAt);
  const deviceId = await getDeviceId();
  // Stamp the next cursor BEFORE reading rows. Anything written while the push
  // is in flight then has updatedAt >= syncedAt and is re-selected on the next
  // push instead of being skipped (worst case: re-sent once — a harmless upsert).
  const syncedAt = Date.now();

  const changes: Array<{ table: string; action: string; data: Record<string, unknown>; updatedAt: number }> = [];

  for (const [tableName, table] of Object.entries(syncableTables)) {
    const rows = db
      .select()
      .from(table as typeof accountsTable)
      .where(gt((table as typeof accountsTable).updatedAt, since))
      .all();

    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const updatedAt = r.updatedAt instanceof Date ? r.updatedAt.getTime() : (r.updatedAt as number);
      changes.push({
        table: tableName,
        action: "upsert",
        data: {
          ...r,
          date: r.date instanceof Date ? r.date.getTime() : r.date,
          createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt,
          updatedAt,
        },
        updatedAt,
      });
    }
  }

  // Recurring rules carry several timestamp columns, so they're serialized
  // separately from the generic syncable tables above.
  const recurringRows = db
    .select()
    .from(recurringRulesTable)
    .where(gt(recurringRulesTable.updatedAt, since))
    .all();

  for (const row of recurringRows) {
    const r = row as Record<string, unknown>;
    const updatedAt = toMs(r.updatedAt);
    changes.push({
      table: "recurring_rules",
      action: "upsert",
      data: {
        ...r,
        startDate: toMs(r.startDate),
        endDate: r.endDate != null ? toMs(r.endDate) : null,
        nextOccurrence: toMs(r.nextOccurrence),
        createdAt: toMs(r.createdAt),
        updatedAt,
      },
      updatedAt,
    });
  }

  if (changes.length === 0) return;

  await api.post("/sync/push", { changes, deviceId });
  await api.post("/sync/ack", { deviceId, syncedAt });
  await setLastSyncAt(syncedAt);
}

export async function fullSync(db: Db, api: AxiosInstance, userId: string) {
  await pushChanges(db, api);
  await pullChanges(db, api, userId);
}
