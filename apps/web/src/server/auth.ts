import NextAuth from 'next-auth';
import Spotify from 'next-auth/providers/spotify';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma, type UserRole } from '@amplifyworld/database';
import { env } from '../env';

/**
 * Auth.js configuration. Spotify doubles as both sign-in and the artist's
 * "connect your socials" moment — reuses the same SPOTIFY_CLIENT_ID/
 * SPOTIFY_CLIENT_SECRET already used by the onboarding wizard's profile
 * importer (server/services/profile-import/spotify.ts), just a different
 * OAuth flow (user login vs. app-level client-credentials search). Only
 * added to `providers` when both vars are set, so the app still boots
 * (with zero sign-in options, same as before) until credentials exist —
 * to add another provider (Google, Discord), follow the same pattern.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  // This app is expected to run behind a reverse proxy/load balancer (its
  // own Host header isn't the public one) — trust it and rely on the
  // proxy/network layer to keep external requests from spoofing that header.
  trustHost: true,
  providers:
    env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
      ? [Spotify({ clientId: env.SPOTIFY_CLIENT_ID, clientSecret: env.SPOTIFY_CLIENT_SECRET })]
      : [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: UserRole }).role ?? 'ARTIST';
      }
      return session;
    },
  },
});
