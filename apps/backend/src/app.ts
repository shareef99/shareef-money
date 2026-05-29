import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { dbMiddleware, type DbVariables } from "./middleware/db.js";
import type { AuthVariables } from "./middleware/auth.js";
import { env } from "./env.js";
import { healthRoute } from "./routes/health/health.route.js";
import { authRoute } from "./routes/auth/auth.route.js";
import { accountsRoute } from "./routes/accounts/accounts.route.js";
import { categoriesRoute } from "./routes/categories/categories.route.js";
import { transactionsRoute } from "./routes/transactions/transactions.route.js";
import { syncRoute } from "./routes/sync/sync.route.js";

export type AppEnv = { Variables: DbVariables & AuthVariables };

const app = new OpenAPIHono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.WEB_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("*", dbMiddleware);

app.route("/", healthRoute);
app.route("/auth", authRoute);
app.route("/api/accounts", accountsRoute);
app.route("/api/categories", categoriesRoute);
app.route("/api/transactions", transactionsRoute);
app.route("/sync", syncRoute);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Shareef Money API",
    version: "1.0.0",
    description: "Backend API for Shareef Money",
  },
});

app.get(
  "/docs",
  apiReference({
    spec: { url: "/openapi.json" },
    theme: "kepler",
    defaultHttpClient: { targetKey: "javascript", clientKey: "fetch" },
  }),
);

export { app };
