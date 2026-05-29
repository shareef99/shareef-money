import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { categoryCreateSchema, categoryUpdateSchema } from "@shareef-money/shared/validation";
import type { Category } from "@shareef-money/db/schema";
import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as categoriesService from "./categories.service.js";

export const categoriesRoute = new OpenAPIHono<AppEnv>();

categoriesRoute.use("*", authMiddleware);

const errorResponse = z.object({ message: z.string() });

function serializeCategory(cat: Category) {
  return {
    ...cat,
    createdAt: cat.createdAt instanceof Date ? cat.createdAt.getTime() : cat.createdAt,
    updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.getTime() : cat.updatedAt,
  };
}

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Categories"],
  summary: "List all categories",
  security: [{ Bearer: [] }],
  responses: {
    200: { description: "List of categories", content: { "application/json": { schema: z.any() } } },
  },
});

categoriesRoute.openapi(listRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const categories = categoriesService.list(db, userId);
  return c.json(categories.map(serializeCategory), 200);
});

const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Categories"],
  summary: "Create a category",
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: categoryCreateSchema } } },
  },
  responses: {
    201: { description: "Category created", content: { "application/json": { schema: z.any() } } },
  },
});

categoriesRoute.openapi(createCategoryRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const category = categoriesService.create(db, userId, body);
  return c.json(serializeCategory(category), 201);
});

const updateCategoryRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Update a category",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
    body: { content: { "application/json": { schema: categoryUpdateSchema } } },
  },
  responses: {
    200: { description: "Category updated", content: { "application/json": { schema: z.any() } } },
    404: { description: "Category not found", content: { "application/json": { schema: errorResponse } } },
  },
});

categoriesRoute.openapi(updateCategoryRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    const category = categoriesService.update(db, userId, id, body);
    return c.json(serializeCategory(category), 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});

const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Categories"],
  summary: "Archive a category",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string().transform(Number) }),
  },
  responses: {
    200: { description: "Category archived", content: { "application/json": { schema: z.object({ message: z.string() }) } } },
    404: { description: "Category not found", content: { "application/json": { schema: errorResponse } } },
  },
});

categoriesRoute.openapi(deleteCategoryRoute, (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  try {
    categoriesService.archive(db, userId, id);
    return c.json({ message: "Category archived" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 404);
    }
    throw error;
  }
});
