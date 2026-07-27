'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import type { ArtistIntelligenceMatch } from '@amplifyworld/core';
import { Button, Modal, Card, Input } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * Opt-in Viberate connection for pages that skipped or predate the
 * onboarding wizard's automatic match attempt. Artist-initiated only — no
 * background matching. Only rendered when the artist hasn't connected yet
 * (see dashboard/[pageId]/page.tsx).
 */
export function ConnectViberateButton({ pageId }: { pageId: string }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistIntelligenceMatch[]>([]);
  const [searching, setSearching] = useState(false);

  const connect = trpc.viberate.connect.useMutation({
    onSuccess: () => {
      utils.page.getById.invalidate({ id: pageId });
      utils.momentum.forPage.invalidate({ pageId });
      setOpen(false);
    },
  });

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await utils.viberate.search.fetch({ query }));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<Activity className="size-3.5" />}
        onClick={() => setOpen(true)}
      >
        Connect Viberate
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Connect Viberate"
        description="Search for your artist profile to add cross-platform momentum data."
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search artist name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), handleSearch())}
            />
            <Button type="button" variant="outline" loading={searching} onClick={handleSearch}>
              Search
            </Button>
          </div>

          {connect.error ? <p className="text-sm text-red-400">{connect.error.message}</p> : null}

          <div className="flex flex-col gap-1.5">
            {results.map((artist) => (
              <Card
                key={artist.externalId}
                interactive
                className="py-2 text-sm"
                onClick={() => connect.mutate({ pageId, externalId: artist.externalId })}
              >
                {artist.name}
              </Card>
            ))}
            {results.length === 0 && !searching ? (
              <p className="text-xs text-white/40">No results yet — try a search above.</p>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
}
