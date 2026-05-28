import { createMiddleware } from "hono/factory";
import { db, type AppDatabase } from "../db.js";

export type DbVariables = {
  db: AppDatabase;
};

export const dbMiddleware = createMiddleware<{ Variables: DbVariables }>(
  async (c, next) => {
    c.set("db", db);
    await next();
  },
);
