import { redirect } from 'next/navigation';
import { auth } from '../../../server/auth';

/**
 * Gates every artist-only route (`[pageId]/**`, `new`, `admin/**`) behind
 * `role !== 'FAN'` — a route group (`(artist)`), so none of these URLs
 * change (`/dashboard/[pageId]` etc. resolve exactly as before the move).
 * This is the actual restriction for the Fan persona described in
 * `start-demo-session.ts`'s `startDemoFanSession` — Discover and
 * Predictions live outside this group and stay open to both roles.
 */
export default async function ArtistOnlyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role === 'FAN') {
    redirect('/dashboard/predictions');
  }

  return <>{children}</>;
}
