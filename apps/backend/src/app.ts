import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { dbMiddleware, type DbVariables } from "./middleware/db.js";
import type { AuthVariables } from "./middleware/auth.js";
import { healthRoute } from "./routes/health/health.route.js";
import { authRoute } from "./routes/auth/auth.route.js";

type AppEnv = { Variables: DbVariables & AuthVariables };

const app = new OpenAPIHono<AppEnv>();

app.use("*", logger());
app.use("*", dbMiddleware);

app.route("/", healthRoute);
app.route("/auth", authRoute);

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

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

export { app };
