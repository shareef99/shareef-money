import { eq, and } from "drizzle-orm";
import { locationsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";

export async function getLocations(db: Db, userId: string) {
  return db.query.locationsTable.findMany({
    where: and(
      eq(locationsTable.userId, userId),
      eq(locationsTable.isArchived, false),
    ),
    orderBy: locationsTable.name,
  });
}

export async function createLocation(db: Db, userId: string, name: string) {
  const [location] = await db
    .insert(locationsTable)
    .values({ id: generateSyncId(), userId, name })
    .returning();
  return location;
}

export async function updateLocation(db: Db, userId: string, id: number, name: string) {
  const [location] = await db
    .update(locationsTable)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)))
    .returning();
  return location;
}

export async function archiveLocation(db: Db, userId: string, id: number) {
  await db
    .update(locationsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)));
}
