import { eq, and } from "drizzle-orm";
import { categoriesTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";

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

export async function getCategoryById(db: Db, userId: string, id: number) {
  return db.query.categoriesTable.findFirst({
    where: and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)),
  });
}
