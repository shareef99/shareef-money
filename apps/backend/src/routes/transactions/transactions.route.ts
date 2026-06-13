import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
} from "@shareef-money/shared/validation";
import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as transactionsService from "./transactions.service.js";

export const transactionsRoute = new OpenAPIHono<AppEnv>();

transactionsRoute.use("*", authMiddleware);

const errorResponse = z.object({ message: z.string() });

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Transactions"],
  summary: "List transactions with filters",
  security: [{ Bearer: [] }],
  request: {
    query: z.object({
      type: z.string().optional(),
      dateFrom: z.string().transform(Number).optional(),
      dateTo: z.string().transform(Number).optional(),
      categoryIds: z.string().optional(),
      accountIds: z.string().optional(),
      limit: z.string().default("100").transform(Number),
      offset: z.string().default("0").transform(Number),
    }),
  },
  responses: {
    200: {
      description: "List of transactions",
      content: {
        "application/json": { schema: z.any() },
      },
    },
  },
});

transactionsRoute.openapi(listRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const query = c.req.valid("query");

  const filters = {
    type: query.type as "income" | "expense" | "transfer" | undefined,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    categoryIds: query.categoryIds
      ? query.categoryIds.split(",").map(Number)
      : undefined,
    accountIds: query.accountIds
      ? query.accountIds.split(",").map(Number)
      : undefined,
    limit: query.limit,
    offset: query.offset,
  };

  const transactions = transactionsService.list(db, userId, filters);
  return c.json(transactions, 200);
});

const createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Transactions"],
  summary: "Create a transaction",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { "application/json": { schema: transactionCreateSchema } },
    },
  },
  responses: {
    201: {
      description: "Transaction created",
      content: { "application/json": { schema: z.any() } },
    },
  },
});

transactionsRoute.openapi(createTransactionRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const transaction = transactionsService.create(db, userId, body);
  return c.json(transaction, 201);
});

const getTransactionRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Get a transaction by ID",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
  },
  responses: {
    200: {
      description: "Transaction details",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Transaction not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

transactionsRoute.openapi(getTransactionRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    const transaction = transactionsService.getById(db, userId, id);
    return c.json(transaction, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const updateTransactionRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Update a transaction",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
    body: {
      content: { "application/json": { schema: transactionUpdateSchema } },
    },
  },
  responses: {
    200: {
      description: "Transaction updated",
      content: { "application/json": { schema: z.any() } },
    },
    404: {
      description: "Transaction not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

transactionsRoute.openapi(updateTransactionRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const transaction = transactionsService.update(db, userId, id, body);
    return c.json(transaction, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const deleteTransactionRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Delete a transaction",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
  },
  responses: {
    200: {
      description: "Transaction deleted",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
      },
    },
    404: {
      description: "Transaction not found",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

transactionsRoute.openapi(deleteTransactionRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    transactionsService.archive(db, userId, id);
    return c.json({ message: "Transaction deleted" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});
