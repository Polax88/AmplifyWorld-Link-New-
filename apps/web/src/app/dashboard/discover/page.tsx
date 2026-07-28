import { DiscoverLeaderboard } from '../../../components/DiscoverLeaderboard';
import { GenreGeoTrends } from '../../../components/GenreGeoTrends';

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold leading-tight">Discover</h1>
        <p className="mt-0.5 text-sm text-white/50">
          Browse the Top 100 artists by Artist Momentum Index, and see which genres are trending where.
        </p>
      </div>

      <DiscoverLeaderboard />

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Genre x geography trends</h2>
        <p className="mt-0.5 text-xs text-white/35">Today&apos;s average AMI score per genre, and where it&apos;s strongest.</p>
      </div>
      <GenreGeoTrends />
    </div>
  );
}
