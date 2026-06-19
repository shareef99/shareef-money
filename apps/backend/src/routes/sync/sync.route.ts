import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  syncPushSchema,
  syncPullSchema,
  syncAckSchema,
} from "@shareef-money/shared/validation";
import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import * as syncService from "./sync.service.js";

export const syncRoute = new OpenAPIHono<AppEnv>();

syncRoute.use("*", authMiddleware);

const pushRoute = createRoute({
  method: "post",
  path: "/push",
  tags: ["Sync"],
  summary: "Push local changes to server",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { "application/json": { schema: syncPushSchema } },
    },
  },
  responses: {
    200: {
      description: "Push results",
      content: {
        "application/json": {
          schema: z.object({
            results: z.array(
              z.object({
                table: z.string(),
                action: z.string(),
                id: z.unknown(),
                status: z.string(),
              }),
            ),
          }),
        },
      },
    },
  },
});

syncRoute.openapi(pushRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const results = await syncService.push(db, userId, body);
  return c.json({ results }, 200);
});

const pullRoute = createRoute({
  method: "post",
  path: "/pull",
  tags: ["Sync"],
  summary: "Pull server changes since last sync",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { "application/json": { schema: syncPullSchema } },
    },
  },
  responses: {
    200: {
      description: "Server changes",
      content: {
        "application/json": {
          schema: z.object({
            changes: z.record(z.string(), z.array(z.unknown())),
            syncedAt: z.number(),
          }),
        },
      },
    },
  },
});

syncRoute.openapi(pullRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const changes = await syncService.pull(db, userId, body.lastSyncAt, body.tables);
  return c.json({ changes, syncedAt: Date.now() }, 200);
});

const ackRoute = createRoute({
  method: "post",
  path: "/ack",
  tags: ["Sync"],
  summary: "Acknowledge sync completion",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { "application/json": { schema: syncAckSchema } },
    },
  },
  responses: {
    200: {
      description: "Sync acknowledged",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

syncRoute.openapi(ackRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  await syncService.ack(db, userId, body);
  return c.json({ message: "Sync acknowledged" }, 200);
});

const statusRoute = createRoute({
  method: "get",
  path: "/status",
  tags: ["Sync"],
  summary: "Get sync status for a device",
  security: [{ Bearer: [] }],
  request: {
    query: z.object({ deviceId: z.string().min(1) }),
  },
  responses: {
    200: {
      description: "Sync status",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              tableName: z.string(),
              lastSyncAt: z.number(),
            }),
          ),
        },
      },
    },
  },
});

syncRoute.openapi(statusRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { deviceId } = c.req.valid("query");
  const logs = await syncService.status(db, userId, deviceId);
  return c.json(logs, 200);
});
