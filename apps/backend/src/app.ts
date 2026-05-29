import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { dbMiddleware, type DbVariables } from "./middleware/db.js";
import type { AuthVariables } from "./middleware/auth.js";
import { healthRoute } from "./routes/health/health.route.js";
import { authRoute } from "./routes/auth/auth.route.js";
import { accountsRoute } from "./routes/accounts/accounts.route.js";
import { categoriesRoute } from "./routes/categories/categories.route.js";
import { transactionsRoute } from "./routes/transactions/transactions.route.js";
import { syncRoute } from "./routes/sync/sync.route.js";

export type AppEnv = { Variables: DbVariables & AuthVariables };

const app = new OpenAPIHono<AppEnv>();

app.use("*", logger());
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
  swaggerUI({
    url: "/openapi.json",
    manuallySwaggerUIHtml: (asset) => `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Shareef Money API</title>
        ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`).join("")}
        <style>
          body { background: #1a1a2e; }
          .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
          .swagger-ui .microlight { filter: invert(100%) hue-rotate(180deg); }
          .swagger-ui svg.arrow { filter: invert(100%) hue-rotate(180deg); }
          .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        ${asset.js.map((url) => `<script src="${url}" crossorigin="anonymous"></script>`).join("")}
        <script>
          SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
        </script>
      </body>
    </html>`,
  }),
);

export { app };
