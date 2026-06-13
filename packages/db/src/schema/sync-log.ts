import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const syncLogTable = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(),
  tableName: text("table_name").notNull(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
