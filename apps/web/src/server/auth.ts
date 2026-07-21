import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma, type UserRole } from '@amplifyworld/database';

/**
 * Auth.js configuration. `providers` starts empty on purpose — this app
 * ships without a hard dependency on any single identity provider. To add
 * one (Google, Spotify, Discord — relevant for musicians), install its
 * package and push it into the array below plus the matching env vars in
 * `.env.example` / `src/env.ts`. Nothing else in the app needs to change.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  // This app is expected to run behind a reverse proxy/load balancer (its
  // own Host header isn't the public one) — trust it and rely on the
  // proxy/network layer to keep external requests from spoofing that header.
  trustHost: true,
  providers: [],
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
