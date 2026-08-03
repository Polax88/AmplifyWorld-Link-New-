'use client';

import { useState } from 'react';
import { Button } from '@amplifyworld/ui';
import { DiscoverLeaderboard } from '../../../components/DiscoverLeaderboard';
import { GenreGeoTrends } from '../../../components/GenreGeoTrends';

type Scope = 'link' | 'all';

export default function DiscoverPage() {
  const [scope, setScope] = useState<Scope>('link');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold leading-tight">Discover</h1>
        <p className="mt-0.5 text-sm text-white/50">
          Browse the Top 100 artists by Artist Momentum Index, and see which genres are trending where.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={scope === 'link' ? 'secondary' : 'ghost'} size="sm" onClick={() => setScope('link')}>
          Link Artists
        </Button>
        <Button variant={scope === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setScope('all')}>
          All Artists
        </Button>
      </div>
      <p className="-mt-4 text-xs text-white/35">
        {scope === 'link'
          ? 'Exclusive to artists using AmplifyWorld Link.'
          : 'Link artists plus simulated industry-wide (3rd-party) data.'}
      </p>

      <DiscoverLeaderboard scope={scope} />

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Genre x geography trends</h2>
        <p className="mt-0.5 text-xs text-white/35">Today&apos;s average AMI score per genre, and where it&apos;s strongest.</p>
      </div>
      <GenreGeoTrends />
    </div>
  );
}
