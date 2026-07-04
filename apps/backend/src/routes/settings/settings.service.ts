import { eq, and } from "drizzle-orm";
import { settingsTable } from "@shareef-money/db/schema";
import type { AppDatabase } from "../../db.js";

// Settings are stored as per-user key/value rows (matching the mobile app).
// The API exposes them as a flat { key: value } map.
export async function getAll(db: AppDatabase, userId: string): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, userId))
    .all();

  const out: Record<string, string> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

// Upsert each provided key, then return the full settings map.
export async function upsertMany(
  db: AppDatabase,
  userId: string,
  entries: Record<string, string>,
): Promise<Record<string, string>> {
  for (const [key, value] of Object.entries(entries)) {
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
  }

  return getAll(db, userId);
}
