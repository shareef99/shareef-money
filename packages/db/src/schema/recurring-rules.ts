import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users.js";
import { transactionsTable } from "./transactions.js";

export const recurringRulesTable = sqliteTable("recurring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactionsTable.id, { onDelete: "cascade" }),
  frequency: text("frequency").notNull(),
  interval: integer("interval").notNull().default(1),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  nextOccurrence: integer("next_occurrence", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const recurringRulesRelations = relations(
  recurringRulesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [recurringRulesTable.userId],
      references: [usersTable.id],
    }),
    transaction: one(transactionsTable, {
      fields: [recurringRulesTable.transactionId],
      references: [transactionsTable.id],
    }),
  }),
);
