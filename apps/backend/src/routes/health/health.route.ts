import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const healthRoute = new OpenAPIHono();

const healthCheck = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "ok" }),
            timestamp: z.string().datetime().openapi({ example: "2026-01-01T00:00:00.000Z" }),
          }),
        },
      },
    },
  },
});

healthRoute.openapi(healthCheck, (c) => {
  return c.json({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
  }, 200);
});

export { healthRoute };
