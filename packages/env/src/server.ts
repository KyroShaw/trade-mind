import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Optional — required only when API Key binding feature is used
    ENCRYPTION_KEY: z.string().length(64).optional(),
    // Optional — required only when AI / market data features are used
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    CRYPTOPANIC_API_KEY: z.string().min(1).optional(),
    COINGECKO_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
