import { z } from 'zod';

/**
 * Single source of truth for required environment variables. Import this
 * (rather than reading `process.env` directly) anywhere env vars are
 * needed — it fails fast with a readable error instead of undefined
 * creeping into runtime logic. Add new variables here first.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  // Shared placeholder secret for verifying inbound integration webhooks.
  // Production should move to a per-IntegrationConnection secret instead.
  INTEGRATION_WEBHOOK_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. See .env.example.');
  }
  return parsed.data;
}

export const env = loadEnv();
