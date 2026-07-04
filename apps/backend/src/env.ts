import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().default(9000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  // libSQL connection. Local dev uses a file URL (a plain SQLite file);
  // production points at Turso, e.g. libsql://<db>-<org>.turso.io with a token.
  DATABASE_URL: z.string().default("file:./data/server.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  WEB_URL: z.string().default("http://localhost:3100"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Invalid environment variables:");
    for (const issue of error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
  }
  process.exit(1);
}

export { env };
