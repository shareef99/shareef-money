import { eq, and, desc, isNull } from "drizzle-orm";
import { categoriesTable } from "@shareef-money/db/schema";
import {
  defaultExpenseCategories,
  defaultIncomeCategories,
} from "@shareef-money/shared/seed";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";

export async function getCategories(db: Db, userId: string, type?: "income" | "expense") {
  const conditions = [
    eq(categoriesTable.userId, userId),
    eq(categoriesTable.isArchived, false),
  ];

  if (type) {
    conditions.push(eq(categoriesTable.type, type));
  }

  return db.query.categoriesTable.findMany({
    where: and(...conditions),
    orderBy: categoriesTable.sortOrder,
  });
}

// Seed the default category set for a user that has none. Idempotent: if the
// user already has any top-level (non-archived) category it does nothing, so
// it's safe to call on every app launch. Returns how many were created.
export async function ensureDefaultCategories(db: Db, userId: string): Promise<number> {
  const existing = await db.query.categoriesTable.findMany({
    where: and(
      eq(categoriesTable.userId, userId),
      isNull(categoriesTable.parentId),
      eq(categoriesTable.isArchived, false),
    ),
    limit: 1,
  });
  if (existing.length > 0) return 0;

  let expenseOrder = 0;
  let incomeOrder = 0;
  const all = [...defaultExpenseCategories, ...defaultIncomeCategories];

  for (const cat of all) {
    await db.insert(categoriesTable).values({
      id: generateSyncId(),
      userId,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      parentId: null,
      sortOrder: cat.type === "income" ? incomeOrder++ : expenseOrder++,
      isDefault: true,
    });
  }

  return all.length;
}

export async function getCategoryById(db: Db, userId: string, id: number) {
  return db.query.categoriesTable.findFirst({
    where: and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)),
  });
}

type CreateCategoryPayload = {
  name: string;
  type: "income" | "expense";
  parentId?: number | null;
};

type UpdateCategoryPayload = {
  name?: string;
};

export async function createCategory(db: Db, userId: string, payload: CreateCategoryPayload) {
  const siblings = await db.query.categoriesTable.findMany({
    where: and(
      eq(categoriesTable.userId, userId),
      eq(categoriesTable.type, payload.type),
      payload.parentId
        ? eq(categoriesTable.parentId, payload.parentId)
        : isNull(categoriesTable.parentId),
    ),
    orderBy: desc(categoriesTable.sortOrder),
    limit: 1,
  });

  const nextSortOrder = (siblings[0]?.sortOrder ?? -1) + 1;

  const [category] = await db
    .insert(categoriesTable)
    .values({
      id: generateSyncId(),
      userId,
      name: payload.name,
      type: payload.type,
      parentId: payload.parentId ?? null,
      sortOrder: nextSortOrder,
    })
    .returning();

  return category;
}

export async function updateCategory(db: Db, userId: string, id: number, payload: UpdateCategoryPayload) {
  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (payload.name !== undefined) setData.name = payload.name;

  const [category] = await db
    .update(categoriesTable)
    .set(setData)
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)))
    .returning();

  return category;
}

export async function archiveCategory(db: Db, userId: string, id: number) {
  const updatedAt = new Date();

  await db
    .update(categoriesTable)
    .set({ isArchived: true, updatedAt })
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)));

  // Archive subcategories too, so they don't linger invisibly under an archived parent
  await db
    .update(categoriesTable)
    .set({ isArchived: true, updatedAt })
    .where(and(eq(categoriesTable.parentId, id), eq(categoriesTable.userId, userId)));
}

export async function reorderCategories(db: Db, userId: string, orderedIds: number[]) {
  const updatedAt = new Date();

  for (const [index, id] of orderedIds.entries()) {
    await db
      .update(categoriesTable)
      .set({ sortOrder: index, updatedAt })
      .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)));
  }
}
