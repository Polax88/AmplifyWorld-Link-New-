import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma, DEMO_USER_ID, type UserRole } from '@amplifyworld/database';

/**
 * Auth.js configuration. `providers` starts empty on purpose — this app
 * ships without a hard dependency on any single identity provider. To add
 * one (Google, Spotify, Discord — relevant for musicians), install its
 * package and push it into the array below plus the matching env vars in
 * `.env.example` / `src/env.ts`. Nothing else in the app needs to change.
 */
const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  // This app is expected to run behind a reverse proxy/load balancer (its
  // own Host header isn't the public one) — trust it and rely on the
  // proxy/network layer to keep external requests from spoofing that header.
  trustHost: true,
  // Fallback secret so the (inert) auth route can initialise in demo mode
  // without requiring NEXTAUTH_SECRET to be set.
  secret: process.env.NEXTAUTH_SECRET ?? 'amplifyworld-demo-secret',
  providers: [],
  pages: {
    signIn: '/login',
  },
});

export const { handlers, signIn, signOut } = nextAuth;

/**
 * DEMO MODE: no identity provider is wired up and there's no live database to
 * store sessions in, so `auth()` returns a static demo session. This makes the
 * dashboard fully browsable against the in-memory demo data. Restore the real
 * `nextAuth.auth` export to re-enable database-backed authentication.
 */
const demoSession = {
  user: {
    id: DEMO_USER_ID,
    name: 'Nova Vale',
    email: 'demo@amplifyworld.ai',
    role: 'ADMIN' as UserRole,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export async function auth() {
  return demoSession;
}
