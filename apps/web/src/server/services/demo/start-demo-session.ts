'use server';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import { env } from '../../../env';
import { SESSION_COOKIE_NAME } from '../../auth';
import { generateDemoArtist } from './generate-demo-artist';

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

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
  if (!env.DEMO_MODE) {
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

  await generateDemoArtist(user.id);

  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_LIFETIME_MS);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: env.NODE_ENV === 'production',
    expires,
  });

  redirect('/dashboard');
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
