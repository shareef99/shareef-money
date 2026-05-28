import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/jwt.js";

export type AuthVariables = {
  userId: string;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ message: "Missing or invalid authorization header" }, 401);
    }

    const token = header.slice(7);

    try {
      const payload = await verifyToken(token);

      if (payload.type !== "access") {
        return c.json({ message: "Invalid token type" }, 401);
      }

      c.set("userId", payload.userId);
      await next();
    } catch {
      return c.json({ message: "Invalid or expired token" }, 401);
    }
  },
);
