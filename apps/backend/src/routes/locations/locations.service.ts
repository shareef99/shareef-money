import { eq, and } from "drizzle-orm";
import { locationsTable } from "@shareef-money/db/schema";
import type {
  LocationCreateInput,
  LocationUpdateInput,
} from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export function list(db: AppDatabase, userId: string) {
  return db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.userId, userId), eq(locationsTable.isArchived, false)))
    .orderBy(locationsTable.name)
    .all();
}

export function getById(db: AppDatabase, userId: string, id: number) {
  const location = db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)))
    .get();

  if (!location) {
    throw new AppError("Location not found", 404);
  }

  return location;
}

export function create(db: AppDatabase, userId: string, payload: LocationCreateInput) {
  return db
    .insert(locationsTable)
    .values({ userId, name: payload.name })
    .returning()
    .get();
}

export function update(
  db: AppDatabase,
  userId: string,
  id: number,
  payload: LocationUpdateInput,
) {
  getById(db, userId, id);

  return db
    .update(locationsTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)))
    .returning()
    .get();
}

export function archive(db: AppDatabase, userId: string, id: number) {
  getById(db, userId, id);

  db.update(locationsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(locationsTable.id, id), eq(locationsTable.userId, userId)))
    .run();
}
