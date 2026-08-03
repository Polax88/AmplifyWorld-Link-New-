'use server';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import { env, isDemoMode } from '../../../env';
import { SESSION_COOKIE_NAME } from '../../auth';
import { generateDemoArtist } from './generate-demo-artist';
import { recordAmpsTransaction } from '../amps-ledger';

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
/** A Fan has no other way to acquire $AMPS (unlike artists, who earn a market rake) — see predictions.ts. */
const FAN_STARTING_AMPS = 1000;

/**
 * The demo sign-in entry point (login page's "Continue as Demo Artist"
 * button). Mints a brand-new demo user + fully-populated artist every time,
 * so simultaneous demo viewers never collide, then creates a real database
 * session row directly — the same mechanism `PrismaAdapter` uses under the
 * hood — and sets it on the same session cookie Auth.js reads (see
 * `SESSION_COOKIE_NAME` in `server/auth.ts`). Deliberately not a Credentials
 * provider: Auth.js's Credentials + database-session combination is a known
 * rough edge, and this app already uses database sessions everywhere else.
 */
export async function startDemoSession(): Promise<void> {
  await createDemoArtistSession();
  redirect('/dashboard');
}

/**
 * The marketing homepage's "See an example" button — same underlying demo
 * artist + session as `startDemoSession`, but lands on the fresh artist's
 * live public page instead of the dashboard. Never depends on a
 * previously-seeded page existing (e.g. a `pnpm db:seed` run against this
 * deployment's database), which a static link to a fixed handle would.
 */
export async function startDemoPreview(): Promise<void> {
  const { handle } = await createDemoArtistSession();
  redirect(`/${handle}`);
}

/**
 * The demo sign-in entry point for the Fan persona (login page's "Continue
 * as Demo Fan" button) — a restricted experience with no page of their
 * own: just Discover + Predictions (see `dashboard/(artist)/layout.tsx`
 * for how artist-only routes are gated away from this role). Fans have no
 * other way to earn $AMPS (artists at least get a market rake — see
 * `predictions.ts`), so they start with a flat balance to bet with.
 */
export async function startDemoFanSession(): Promise<void> {
  if (!isDemoMode) {
    throw new Error('Demo mode is not enabled.');
  }

  const user = await prisma.user.create({
    data: {
      email: `fan+${randomBytes(8).toString('hex')}@amplifyworld.ai`,
      name: 'Demo Fan',
      role: 'FAN',
    },
  });

  await recordAmpsTransaction(prisma, {
    userId: user.id,
    type: 'SIGNUP_BONUS',
    amount: FAN_STARTING_AMPS,
    description: 'Welcome bonus to start predicting',
  });

  await createSessionCookie(user.id);
  redirect('/dashboard/predictions');
}

async function createDemoArtistSession(): Promise<{ handle: string }> {
  if (!isDemoMode) {
    throw new Error('Demo mode is not enabled.');
  }

  await ensureDemoFeatureFlags();

  const user = await prisma.user.create({
    data: {
      email: `demo+${randomBytes(8).toString('hex')}@amplifyworld.ai`,
      name: 'Demo Artist',
      role: 'ARTIST',
    },
  });

  const { handle } = await generateDemoArtist(user.id);
  await createSessionCookie(user.id);

  return { handle };
}

async function createSessionCookie(userId: string): Promise<void> {
  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_LIFETIME_MS);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    expires,
  });
}

/**
 * Demo mode needs the AI wizard and Viberate UI actually visible — flip
 * those flags on regardless of whether `prisma/seed.ts` has ever run
 * against this database (a fresh demo deployment may have only run
 * migrations). Idempotent; cheap enough to call on every demo sign-in.
 */
async function ensureDemoFeatureFlags(): Promise<void> {
  await Promise.all([
    prisma.featureFlag.upsert({
      where: { key: 'ai-onboarding-wizard' },
      create: {
        key: 'ai-onboarding-wizard',
        description: 'Route "New page" to the AI-assisted onboarding wizard instead of the blank-canvas modal.',
        isEnabled: true,
        rolloutPercentage: 100,
      },
      update: { isEnabled: true, rolloutPercentage: 100 },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'viberate-integration' },
      create: {
        key: 'viberate-integration',
        description: 'Show Viberate-connected UI (onboarding match card, "Connect Viberate" editor action).',
        isEnabled: true,
        rolloutPercentage: 100,
      },
      update: { isEnabled: true, rolloutPercentage: 100 },
    }),
  ]);
}
