import { eq, and } from "drizzle-orm";
import { contactsTable } from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";

export async function getContacts(db: Db, userId: string) {
  return db.query.contactsTable.findMany({
    where: and(
      eq(contactsTable.userId, userId),
      eq(contactsTable.isArchived, false),
    ),
    orderBy: contactsTable.name,
  });
}

export async function createContact(db: Db, userId: string, name: string) {
  const [contact] = await db
    .insert(contactsTable)
    .values({ id: generateSyncId(), userId, name })
    .returning();
  return contact;
}

export async function updateContact(db: Db, userId: string, id: number, name: string) {
  const [contact] = await db
    .update(contactsTable)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, userId)))
    .returning();
  return contact;
}

export async function archiveContact(db: Db, userId: string, id: number) {
  await db
    .update(contactsTable)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, userId)));
}
