import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDb } from "./client.js";

export function runMigrations(dbPath = "sqlite.db") {
  const db = createDb(dbPath);
  migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
}
