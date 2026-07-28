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

  // Onboarding wizard AI assistance. Optional — when unset, the wizard falls
  // back to template-only drafts instead of erroring (see ai-assistant.ts).
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Onboarding wizard Spotify profile import. Optional — when unset, the
  // "search Spotify" affordance just returns no results (see profile-import).
  SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),

  // Authenticates Vercel Cron's daily call to /api/cron/momentum (the
  // Artist Momentum Index ETL). Required only in environments that run the
  // cron — see .env.example.
  CRON_SECRET: z.string().min(1).optional(),

  // Viberate Music Data API. Optional and currently unused — the real HTTP
  // client isn't implemented yet (no API product subscription exists), so
  // server/services/artist-intelligence always resolves to a no-op today
  // regardless of this value. Defined now so it's ready to wire up.
  VIBERATE_API_KEY: z.string().min(1).optional(),

  // Turns this deployment into a fully-populated demo: a "Continue as Demo
  // Artist" sign-in (no real OAuth), and every integration below (Viberate,
  // Spotify search, DSP "connect" flows) swaps to a realistic mock instead of
  // its no-op fallback. This app is currently a demo-only deployment, so
  // demo mode defaults ON — set DEMO_MODE=false explicitly to turn it off
  // (e.g. once real Spotify/Viberate credentials are ready for production).
  DEMO_MODE: z.string().optional(),
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

/** Demo mode defaults ON — see `DEMO_MODE`'s schema comment above. */
export const isDemoMode = env.DEMO_MODE !== 'false';
