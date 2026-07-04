import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shareef-money/db/schema";
import { env } from "./env.js";

// libSQL works against a local file (file:./data/server.db) in dev and a hosted
// Turso database (libsql://… + auth token) in production — same SQLite dialect,
// so the Drizzle schema is unchanged. Note: this driver is async (queries return
// promises), unlike the previous synchronous better-sqlite3 driver.
const client = createClient({
  url: env.DATABASE_URL,
  ...(env.DATABASE_AUTH_TOKEN ? { authToken: env.DATABASE_AUTH_TOKEN } : {}),
});

export const db = drizzle(client, { schema });
export type AppDatabase = typeof db;
