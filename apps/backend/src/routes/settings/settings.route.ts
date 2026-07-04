import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import * as settingsService from "./settings.service.js";

export const settingsRoute = new OpenAPIHono<AppEnv>();

settingsRoute.use("*", authMiddleware);

const settingsMap = z.record(z.string(), z.string());

const getRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Settings"],
  summary: "Get all settings for the current user",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "Settings map",
      content: { "application/json": { schema: settingsMap } },
    },
  },
});

settingsRoute.openapi(getRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  return c.json(await settingsService.getAll(db, userId), 200);
});

const patchRoute = createRoute({
  method: "patch",
  path: "/",
  tags: ["Settings"],
  summary: "Upsert one or more settings",
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: settingsMap } } },
  },
  responses: {
    200: {
      description: "Updated settings map",
      content: { "application/json": { schema: settingsMap } },
    },
  },
});

settingsRoute.openapi(patchRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  return c.json(await settingsService.upsertMany(db, userId, body), 200);
});
