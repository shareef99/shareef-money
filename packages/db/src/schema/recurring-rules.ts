import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";
import { transactionsTable } from "./transactions";

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
  // Soft-delete tombstone (epoch ms; see transactions.deletedAt). Reads filter it.
  deletedAt: integer("deleted_at"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
