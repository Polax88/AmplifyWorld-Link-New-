import { z } from 'zod';

/**
 * Single source of truth for required environment variables. Import this
 * (rather than reading `process.env` directly) anywhere env vars are
 * needed — it fails fast with a readable error instead of undefined
 * creeping into runtime logic. Add new variables here first.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // DEMO MODE: the app runs on an in-memory store, so a real database URL and
  // auth secret aren't required. These are optional with safe demo defaults so
  // nothing crashes when they're unset. Restore `.url()` / `.min(1)` (without
  // defaults) once a live database and real auth are reconnected.
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1).default('amplifyworld-demo-secret'),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  // Shared placeholder secret for verifying inbound integration webhooks.
  // Production should move to a per-IntegrationConnection secret instead.
  INTEGRATION_WEBHOOK_SECRET: z.string().min(1).default('amplifyworld-demo-webhook-secret'),

  // Onboarding wizard AI assistance. Optional — when unset, the wizard falls
  // back to template-only drafts instead of erroring (see ai-assistant.ts).
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Onboarding wizard Spotify profile import. Optional — when unset, the
  // "search Spotify" affordance just returns no results (see profile-import).
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
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
