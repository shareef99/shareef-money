import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { env } from "../env.js";

const isProduction = env.NODE_ENV === "production";
const THIRTY_DAYS = 30 * 24 * 60 * 60;
const FIFTEEN_MINUTES = 15 * 60;

export function setAuthCookies(
  c: Context,
  accessToken: string,
  refreshToken: string,
) {
  setCookie(c, "access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: FIFTEEN_MINUTES,
  });

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/auth/refresh",
    maxAge: THIRTY_DAYS,
  });
}

export function clearAuthCookies(c: Context) {
  deleteCookie(c, "access_token", { path: "/" });
  deleteCookie(c, "refresh_token", { path: "/auth/refresh" });
}
