import { notFound } from 'next/navigation';
import { auth } from '../../../../../server/auth';
import { MomentumLeaderboard } from '../../../../../components/MomentumLeaderboard';

/**
 * "Top 100 Rising Artists" — the Artist Momentum Index leaderboard. Admin-only
 * for v1: this is the investor/label/brand-facing data product the deck
 * describes, not an artist-facing discovery feature yet. The underlying
 * `momentum.leaderboard` procedure is also adminProcedure-gated server-side,
 * so this check is a UX nicety, not the only barrier.
 */
export default async function AdminMomentumPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold leading-tight">Top 100 Rising Artists</h1>
        <p className="mt-1 text-sm text-white/50">
          Ranked by Artist Momentum Index change, not raw traffic — a small artist accelerating matters more here
          than a big one holding steady.
        </p>
      </div>
      <MomentumLeaderboard />
    </div>
  );
}
