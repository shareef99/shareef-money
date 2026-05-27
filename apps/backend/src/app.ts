import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { healthRoute } from "./routes/health.js";

const app = new OpenAPIHono();

app.route("/", healthRoute);

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
