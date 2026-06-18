import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";
import { accountsTable } from "./accounts";
import { locationsTable } from "./locations";
import { contactsTable } from "./contacts";

// Mirrors `transactionTypes` in @shareef-money/shared (kept inline so the db
// package stays dependency-free). Typing the column narrows the inferred row
// type to this union, so consumers get exhaustiveness checks instead of `string`.
const TRANSACTION_TYPES = [
  "income",
  "expense",
  "transfer",
  "debt_lend",
  "debt_borrow",
] as const;

export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    amount: integer("amount").notNull(),
    fee: integer("fee").notNull().default(0),
    categoryId: integer("category_id").references(() => categoriesTable.id),
    accountId: integer("account_id")
      .notNull()
      .references(() => accountsTable.id),
    toAccountId: integer("to_account_id").references(() => accountsTable.id),
    // Debt counterparty (the person) for debt_lend / debt_borrow. Null otherwise.
    contactId: integer("contact_id").references(() => contactsTable.id),
    // Optional repayment due date for debts (drives overdue badges + reminders).
    dueDate: integer("due_date", { mode: "timestamp" }),
    locationId: integer("location_id").references(() => locationsTable.id),
    note: text("note"),
    // Soft-delete tombstone (epoch ms, plain integer so it rides through sync
    // untouched). Set instead of hard-deleting, so the deletion propagates
    // (updatedAt bumps) and the row can't resurrect on the next pull. All reads
    // must filter `deletedAt IS NULL`.
    deletedAt: integer("deleted_at"),
    date: integer("date", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("idx_transactions_user_date").on(table.userId, table.date),
    index("idx_transactions_type").on(table.type),
    index("idx_transactions_account").on(table.accountId),
    index("idx_transactions_category").on(table.categoryId),
    index("idx_transactions_contact").on(table.contactId),
  ],
);

export const transactionContactsTable = sqliteTable(
  "transaction_contacts",
  {
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactionsTable.id, { onDelete: "cascade" }),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contactsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.transactionId, table.contactId] }),
  ],
);
