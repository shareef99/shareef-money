import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { accountCreateSchema, accountUpdateSchema } from "@shareef-money/shared/validation";

import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as accountsService from "./accounts.service.js";

export const accountsRoute = new OpenAPIHono<AppEnv>();

accountsRoute.use("*", authMiddleware);

const errorResponse = z.object({ message: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Accounts"],
  summary: "List all accounts",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "List of accounts",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

accountsRoute.openapi(listRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const accounts = await accountsService.list(db, userId);
  return c.json(accounts, 200);
});

const createAccountRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Accounts"],
  summary: "Create an account",
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: accountCreateSchema } } },
  },
  responses: {
    201: {
      description: "Account created",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

accountsRoute.openapi(createAccountRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const account = await accountsService.create(db, userId, body);
  return c.json(account, 201);
});

const getAccountRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Get an account by ID",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
  },
  responses: {
    200: {
      description: "Account details",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Account not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

accountsRoute.openapi(getAccountRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    const account = await accountsService.getById(db, userId, id);
    return c.json(account, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const updateAccountRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Update an account",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
    body: { content: { "application/json": { schema: accountUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Account updated",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Account not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

accountsRoute.openapi(updateAccountRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const account = await accountsService.update(db, userId, id, body);
    return c.json(account, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Accounts"],
  summary: "Archive an account",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
  },
  responses: {
    200: {
      description: "Account archived",
      content: { "application/json": { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: "Account not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

accountsRoute.openapi(deleteAccountRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    await accountsService.archive(db, userId, id);
    return c.json({ message: "Account archived" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});
