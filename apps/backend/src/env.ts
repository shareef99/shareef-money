import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().default(9000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
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
