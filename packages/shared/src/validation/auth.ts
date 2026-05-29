import { z } from "zod";
import { authProviders, deviceTypes } from "../types";

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1, "Required").max(100, "Name is too long"),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Required"),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z
  .object({
    idToken: z.string().min(1),
    deviceName: z.string().optional(),
    deviceType: z.enum(deviceTypes),
  })
  .strict();
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const authTokensSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .strict();
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const userProfileSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    authProvider: z.enum(authProviders),
    createdAt: z.number(),
  })
  .strict();
export type UserProfile = z.infer<typeof userProfileSchema>;
