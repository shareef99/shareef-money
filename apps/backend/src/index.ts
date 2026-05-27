import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { app } from "./app.js";

console.log(`Server running on http://localhost:${env.PORT}`);
console.log(`API docs available at http://localhost:${env.PORT}/docs`);

serve({ fetch: app.fetch, port: env.PORT });
