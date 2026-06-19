import { eq } from "drizzle-orm";
import {
  usersTable,
  sessionsTable,
  accountsTable,
  categoriesTable,
  settingsTable,
} from "@shareef-money/db/schema";
import {
  defaultExpenseCategories,
  defaultIncomeCategories,
  defaultSettings,
  defaultAccountName,
} from "@shareef-money/shared/seed";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../lib/jwt.js";
import { verifyGoogleIdToken } from "../../lib/google-auth.js";
import { AppError } from "../../lib/error.js";
import type { AppDatabase } from "../../db.js";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RefreshPayload = {
  refreshToken: string;
};

type GoogleAuthPayload = {
  idToken: string;
  deviceName?: string | undefined;
  deviceType: "mobile" | "web";
};

async function createSession(
  db: AppDatabase,
  userId: string,
  deviceName: string | undefined,
  deviceType: "mobile" | "web",
): Promise<AuthTokens> {
  const accessToken = await signAccessToken(userId);
  const refreshToken = await signRefreshToken(userId);

  const hashedRefresh = await hashRefreshToken(refreshToken);

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  await db
    .insert(sessionsTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      refreshToken: hashedRefresh,
      deviceName: deviceName ?? null,
      deviceType,
      expiresAt: new Date(Date.now() + thirtyDaysMs),
    })
    .run();

  return { accessToken, refreshToken };
}

async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function seedUserDefaults(db: AppDatabase, userId: string): Promise<void> {
  const allCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];
  for (const cat of allCategories) {
    await db
      .insert(categoriesTable)
      .values({
        userId,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        isDefault: true,
      })
      .run();
  }

  await db.insert(accountsTable).values({ userId, name: defaultAccountName }).run();

  const entries = Object.entries(defaultSettings).map(([key, val]) => ({
    userId,
    key,
    value: typeof val === "string" ? val : JSON.stringify(val),
  }));
  for (const entry of entries) {
    await db.insert(settingsTable).values(entry).run();
  }
}

export async function register(
  db: AppDatabase,
  payload: RegisterPayload,
): Promise<AuthTokens> {
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, payload.email))
    .get();

  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(payload.password);
  const userId = crypto.randomUUID();

  await db
    .insert(usersTable)
    .values({
      id: userId,
      email: payload.email,
      passwordHash,
      name: payload.name,
      authProvider: "email",
    })
    .run();

  await seedUserDefaults(db, userId);

  return createSession(db, userId, undefined, "web");
}

export async function login(
  db: AppDatabase,
  payload: LoginPayload,
): Promise<AuthTokens> {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, payload.email))
    .get();

  if (!user?.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(user.passwordHash, payload.password);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  return createSession(db, user.id, undefined, "web");
}

export async function googleAuth(
  db: AppDatabase,
  payload: GoogleAuthPayload,
): Promise<AuthTokens> {
  let googleUser;
  try {
    googleUser = await verifyGoogleIdToken(payload.idToken);
  } catch {
    throw new AppError("Invalid Google ID token", 401);
  }

  const existingByGoogleId = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.googleId, googleUser.sub))
    .get();

  if (existingByGoogleId) {
    return createSession(db, existingByGoogleId.id, payload.deviceName, payload.deviceType);
  }

  const existingByEmail = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, googleUser.email))
    .get();

  if (existingByEmail) {
    await db
      .update(usersTable)
      .set({
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture ?? existingByEmail.avatarUrl,
        authProvider: "google",
      })
      .where(eq(usersTable.id, existingByEmail.id))
      .run();

    return createSession(db, existingByEmail.id, payload.deviceName, payload.deviceType);
  }

  const userId = crypto.randomUUID();

  await db
    .insert(usersTable)
    .values({
      id: userId,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture ?? null,
      authProvider: "google",
      googleId: googleUser.sub,
    })
    .run();

  await seedUserDefaults(db, userId);

  return createSession(db, userId, payload.deviceName, payload.deviceType);
}

export async function refresh(
  db: AppDatabase,
  payload: RefreshPayload,
): Promise<AuthTokens> {
  let tokenPayload;
  try {
    tokenPayload = await verifyToken(payload.refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (tokenPayload.type !== "refresh") {
    throw new AppError("Invalid token type", 401);
  }

  const hashedRefresh = await hashRefreshToken(payload.refreshToken);

  const session = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.refreshToken, hashedRefresh))
    .get();

  if (!session) {
    throw new AppError("Session not found", 401);
  }

  if (session.expiresAt < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id)).run();
    throw new AppError("Session expired", 401);
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id)).run();

  return createSession(db, tokenPayload.userId, session.deviceName ?? undefined, session.deviceType as "mobile" | "web");
}

export async function logout(db: AppDatabase, refreshToken: string): Promise<void> {
  const hashed = await hashRefreshToken(refreshToken);
  await db.delete(sessionsTable).where(eq(sessionsTable.refreshToken, hashed)).run();
}

export async function getProfile(db: AppDatabase, userId: string) {
  const user = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      authProvider: usersTable.authProvider,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .get();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
