import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  contactCreateSchema,
  contactUpdateSchema,
} from "@shareef-money/shared/validation";

import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as contactsService from "./contacts.service.js";

export const contactsRoute = new OpenAPIHono<AppEnv>();

contactsRoute.use("*", authMiddleware);

const errorResponse = z.object({ message: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Contacts"],
  summary: "List all contacts",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "List of contacts",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

contactsRoute.openapi(listRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  return c.json(contactsService.list(db, userId), 200);
});

const createContactRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Contacts"],
  summary: "Create a contact",
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: contactCreateSchema } } },
  },
  responses: {
    201: {
      description: "Contact created",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

contactsRoute.openapi(createContactRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  return c.json(contactsService.create(db, userId, body), 201);
});

const updateContactRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Contacts"],
  summary: "Update a contact",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
    body: { content: { "application/json": { schema: contactUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Contact updated",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Contact not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

contactsRoute.openapi(updateContactRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    return c.json(contactsService.update(db, userId, id, body), 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const deleteContactRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Contacts"],
  summary: "Archive a contact",
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string().transform(Number) }) },
  responses: {
    200: {
      description: "Contact archived",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Contact not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

contactsRoute.openapi(deleteContactRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    contactsService.archive(db, userId, id);
    return c.json({ message: "Contact archived" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});
