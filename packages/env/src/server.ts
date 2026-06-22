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
    // 32-byte key encoded as 64-char hex string, used for AES-256-GCM encryption
    ENCRYPTION_KEY: z.string().length(64),
    // External API keys for market data (optional in dev, required in prod)
    ANTHROPIC_API_KEY: z.string().min(1),
    CRYPTOPANIC_API_KEY: z.string().min(1),
    COINGECKO_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
