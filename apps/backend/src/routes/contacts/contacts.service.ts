import { eq, and } from "drizzle-orm";
import { contactsTable } from "@shareef-money/db/schema";
import type {
  ContactCreateInput,
  ContactUpdateInput,
} from "@shareef-money/shared/validation";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

export async function list(db: AppDatabase, userId: string) {
  return db
    .select()
    .from(contactsTable)
    .where(and(eq(contactsTable.userId, userId), eq(contactsTable.isArchived, false)))
    .orderBy(contactsTable.name)
    .all();
}

export async function getById(db: AppDatabase, userId: string, id: number) {
  const contact = await db
    .select()
    .from(contactsTable)
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, userId)))
    .get();

  if (!contact) {
    throw new AppError("Contact not found", 404);
  }

  return contact;
}

export async function create(db: AppDatabase, userId: string, payload: ContactCreateInput) {
  return db
    .insert(contactsTable)
    .values({ userId, name: payload.name })
    .returning()
    .get();
}

export async function update(
  db: AppDatabase,
  userId: string,
  id: number,
  payload: ContactUpdateInput,
) {
  await getById(db, userId, id);

  return db
    .update(contactsTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, userId)))
    .returning()
    .get();
}

export async function archive(db: AppDatabase, userId: string, id: number) {
  await getById(db, userId, id);

  await db
    .update(contactsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, userId)))
    .run();
}
