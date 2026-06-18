import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  locationCreateSchema,
  locationUpdateSchema,
} from "@shareef-money/shared/validation";

import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as locationsService from "./locations.service.js";

export const locationsRoute = new OpenAPIHono<AppEnv>();

locationsRoute.use("*", authMiddleware);

const errorResponse = z.object({ message: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Locations"],
  summary: "List all locations",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "List of locations",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

locationsRoute.openapi(listRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  return c.json(locationsService.list(db, userId), 200);
});

const createLocationRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Locations"],
  summary: "Create a location",
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: locationCreateSchema } } },
  },
  responses: {
    201: {
      description: "Location created",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

locationsRoute.openapi(createLocationRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  return c.json(locationsService.create(db, userId, body), 201);
});

const updateLocationRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Locations"],
  summary: "Update a location",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
    body: { content: { "application/json": { schema: locationUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Location updated",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Location not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

locationsRoute.openapi(updateLocationRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    return c.json(locationsService.update(db, userId, id, body), 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const deleteLocationRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Locations"],
  summary: "Archive a location",
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().transform(Number) }) },
  responses: {
    200: {
      description: "Location archived",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Location not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

locationsRoute.openapi(deleteLocationRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    locationsService.archive(db, userId, id);
    return c.json({ message: "Location archived" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});
