import { eq, and } from "drizzle-orm";
import { settingsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";

export async function getSetting(db: Db, userId: string, key: string) {
  const row = await db.query.settingsTable.findFirst({
    where: and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)),
  });
  return row?.value ?? null;
}

export async function getAllSettings(db: Db, userId: string) {
  const rows = await db.query.settingsTable.findMany({
    where: eq(settingsTable.userId, userId),
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(db: Db, userId: string, key: string, value: string) {
  await db
    .insert(settingsTable)
    .values({ userId, key, value })
    .onConflictDoUpdate({
      target: [settingsTable.userId, settingsTable.key],
      set: { value },
    });
}
