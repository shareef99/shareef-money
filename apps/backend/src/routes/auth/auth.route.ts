import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from "@shareef-money/shared/validation";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../../app.js";
import { authMiddleware } from "../../middleware/auth.js";
import { AppError } from "../../lib/error.js";
import { setAuthCookies, clearAuthCookies } from "../../lib/cookies.js";
import * as authService from "./auth.service.js";
import type { Context } from "hono";

export const authRoute = new OpenAPIHono<AppEnv>();

const authTokensResponse = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  message: z.string().optional(),
});

const errorResponse = z.object({
  message: z.string(),
});

function isWebClient(c: Context) {
  return !!c.req.header("Origin");
}

function applyTokens(
  c: Context,
  tokens: { accessToken: string; refreshToken: string },
) {
  if (isWebClient(c)) {
    setAuthCookies(c, tokens.accessToken, tokens.refreshToken);
    return { message: "ok" };
  }
  return tokens;
}

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
    return c.json(applyTokens(c, tokens), 201);
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
    return c.json(applyTokens(c, tokens), 200);
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
    return c.json(applyTokens(c, tokens), 200);
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
      content: {
        "application/json": {
          schema: z.object({ refreshToken: z.string().optional() }).optional(),
        },
      },
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
  const refreshToken = body?.refreshToken ?? getCookie(c, "refresh_token");

  if (!refreshToken) {
    return c.json({ message: "Missing refresh token" }, 401);
  }

  try {
    const tokens = await authService.refresh(db, { refreshToken });
    return c.json(applyTokens(c, tokens), 200);
  } catch (error) {
    if (error instanceof AppError) {
      clearAuthCookies(c);
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
      content: {
        "application/json": {
          schema: z.object({ refreshToken: z.string().optional() }).optional(),
        },
      },
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
  const refreshToken = body?.refreshToken ?? getCookie(c, "refresh_token");

  if (refreshToken) {
    await authService.logout(db, refreshToken);
  }

  clearAuthCookies(c);
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
    const profile = await authService.getProfile(db, userId);
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
