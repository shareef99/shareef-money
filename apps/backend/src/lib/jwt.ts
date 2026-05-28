import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  userId: string;
  type: "access" | "refresh";
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: "access" } satisfies Omit<TokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(secret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: "refresh" } satisfies Omit<TokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as TokenPayload;
}
