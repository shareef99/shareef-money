import { relations } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const settingsTable = sqliteTable(
  "settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

export const settingsRelations = relations(settingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [settingsTable.userId],
    references: [usersTable.id],
  }),
}));
