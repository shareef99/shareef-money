import { eq, and } from "drizzle-orm";
import { categoriesTable } from "@shareef-money/db/schema";
import type { CategoryCreateInput, CategoryUpdateInput } from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export function list(db: AppDatabase, userId: string) {
  return db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.userId, userId), eq(categoriesTable.isArchived, false)))
    .orderBy(categoriesTable.sortOrder)
    .all();
}

export function getById(db: AppDatabase, userId: string, id: number) {
  const category = db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)))
    .get();

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

export function create(db: AppDatabase, userId: string, payload: CategoryCreateInput) {
  return db
    .insert(categoriesTable)
    .values({
      userId,
      parentId: payload.parentId ?? null,
      name: payload.name,
      type: payload.type,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .returning()
    .get();
}

export function update(db: AppDatabase, userId: string, id: number, payload: CategoryUpdateInput) {
  getById(db, userId, id);

  return db
    .update(categoriesTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)))
    .returning()
    .get();
}

export function archive(db: AppDatabase, userId: string, id: number) {
  getById(db, userId, id);

  db.update(categoriesTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)))
    .run();
}
