import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
} from "@shareef-money/shared/validation";
import type { DbVariables } from "../../middleware/db.js";
import type { AuthVariables } from "../../middleware/auth.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import * as authService from "./auth.service.js";

type AuthEnv = { Variables: DbVariables & AuthVariables };

export const authRoute = new OpenAPIHono<AuthEnv>();

const authTokensResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const errorResponse = z.object({
  message: z.string(),
});

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags: ["Auth"],
  summary: "Register a new account",
  request: {
    body: {
      content: { "application/json": { schema: registerSchema } },
    },
  },
  responses: {
    201: {
      description: "Account created",
      content: { "application/json": { schema: authTokensResponse } },
    },
    409: {
      description: "Email already registered",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

authRoute.openapi(registerRoute, async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");

  try {
    const tokens = await authService.register(db, body);
    return c.json(tokens, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 409);
    }
    throw error;
  }
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Auth"],
  summary: "Login with email and password",
  request: {
    body: {
      content: { "application/json": { schema: loginSchema } },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: authTokensResponse } },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

authRoute.openapi(loginRoute, async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");

  try {
    const tokens = await authService.login(db, body);
    return c.json(tokens, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 401);
    }
    throw error;
  }
});

const googleRoute = createRoute({
  method: "post",
  path: "/google",
  tags: ["Auth"],
  summary: "Sign in with Google",
  request: {
    body: {
      content: { "application/json": { schema: googleAuthSchema } },
    },
  },
  responses: {
    200: {
      description: "Authenticated with Google",
      content: { "application/json": { schema: authTokensResponse } },
    },
    401: {
      description: "Invalid Google token",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

authRoute.openapi(googleRoute, async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");

  try {
    const tokens = await authService.googleAuth(db, body);
    return c.json(tokens, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 401);
    }
    throw error;
  }
});

const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  request: {
    body: {
      content: { "application/json": { schema: refreshTokenSchema } },
    },
  },
  responses: {
    200: {
      description: "Tokens refreshed",
      content: { "application/json": { schema: authTokensResponse } },
    },
    401: {
      description: "Invalid refresh token",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

authRoute.openapi(refreshRoute, async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");

  try {
    const tokens = await authService.refresh(db, body);
    return c.json(tokens, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 401);
    }
    throw error;
  }
});

const logoutRoute = createRoute({
  method: "post",
  path: "/logout",
  tags: ["Auth"],
  summary: "Logout and invalidate session",
  request: {
    body: {
      content: { "application/json": { schema: refreshTokenSchema } },
    },
  },
  responses: {
    200: {
      description: "Logged out",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

authRoute.openapi(logoutRoute, async (c) => {
  const db = c.get("db");
  const body = c.req.valid("json");

  await authService.logout(db, body.refreshToken);
  return c.json({ message: "Logged out" }, 200);
});

const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Auth"],
  summary: "Get current user profile",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "User profile",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
            avatarUrl: z.string().nullable(),
            authProvider: z.string(),
            createdAt: z.number(),
          }),
        },
      },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

authRoute.use("/me", authMiddleware);

authRoute.openapi(meRoute, async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  try {
    const profile = authService.getProfile(db, userId);
    return c.json(
      {
        ...profile,
        createdAt: profile.createdAt.getTime(),
      },
      200,
    );
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ message: error.message }, error.status as 401);
    }
    throw error;
  }
});
