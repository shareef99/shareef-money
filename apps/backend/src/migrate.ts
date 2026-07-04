import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "./env.js";

// Resolve the migrations folder both when run via tsx from src/ (dev) and from
// the bundled dist/ (the build copies the SQL files into dist/drizzle).
const here = dirname(fileURLToPath(import.meta.url));
const bundled = resolve(here, "drizzle");
const migrationsFolder = existsSync(bundled)
  ? bundled
  : resolve(here, "../../../packages/db/drizzle");

const client = createClient({
  url: env.DATABASE_URL,
  ...(env.DATABASE_AUTH_TOKEN ? { authToken: env.DATABASE_AUTH_TOKEN } : {}),
});
const db = drizzle(client);

await migrate(db, { migrationsFolder });

const result = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
console.log("Migrations applied. Tables:", result.rows.map((r) => r.name).join(", "));
client.close();
