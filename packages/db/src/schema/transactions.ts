import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users.js";
import { categoriesTable } from "./categories.js";
import { accountsTable } from "./accounts.js";
import { recurringRulesTable } from "./recurring-rules.js";

export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    amount: integer("amount").notNull(),
    fee: integer("fee").notNull().default(0),
    categoryId: integer("category_id").references(() => categoriesTable.id),
    accountId: integer("account_id")
      .notNull()
      .references(() => accountsTable.id),
    toAccountId: integer("to_account_id").references(() => accountsTable.id),
    note: text("note"),
    description: text("description"),
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
  ],
);

export const transactionsRelations = relations(
  transactionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [transactionsTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [transactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
    account: one(accountsTable, {
      fields: [transactionsTable.accountId],
      references: [accountsTable.id],
      relationName: "sourceAccount",
    }),
    toAccount: one(accountsTable, {
      fields: [transactionsTable.toAccountId],
      references: [accountsTable.id],
      relationName: "destinationAccount",
    }),
    recurringRules: many(recurringRulesTable),
  }),
);
