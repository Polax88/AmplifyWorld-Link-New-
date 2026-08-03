'use client';

import { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import type { ArtistSearchResult } from '@amplifyworld/core';
import { Button, Input, Card } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { platformLabel } from '../../../../components/blocks/SocialBlockView';
import { SOCIAL_PLATFORMS, type WizardState } from './types';

export function StartStep({
  onComplete,
  onSkip,
}: {
  onComplete: (state: WizardState) => void;
  onSkip: () => void;
}) {
  const utils = trpc.useUtils();
  const startMutation = trpc.onboarding.start.useMutation();
  const draftMutation = trpc.onboarding.draft.useMutation();

  const [stageName, setStageName] = useState('');
  const [genre, setGenre] = useState('');
  const [socialHandles, setSocialHandles] = useState<Record<string, string>>({});

  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<ArtistSearchResult[]>([]);
  const [spotifySearching, setSpotifySearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitting = startMutation.isPending || draftMutation.isPending;

  async function handleSpotifySearch() {
    if (!spotifyQuery.trim()) return;
    setSpotifySearching(true);
    try {
      const results = await utils.onboarding.searchSpotifyArtist.fetch({ query: spotifyQuery });
      setSpotifyResults(results);
    } catch {
      setSpotifyResults([]);
    } finally {
      setSpotifySearching(false);
    }
  }

  async function handleSubmit() {
    if (!stageName.trim()) return;
    setError(null);

    const handles = Object.entries(socialHandles)
      .filter(([, handle]) => handle.trim())
      .map(([platform, handle]) => ({ platform, handle: handle.trim() }));

    try {
      const page = await startMutation.mutateAsync({ stageName });
      const draft = await draftMutation.mutateAsync({
        pageId: page.id,
        stageName,
        genre: genre.trim() || undefined,
        spotifyArtistId: selectedArtist?.id,
        socialHandles: handles.length > 0 ? handles : undefined,
      });

      onComplete({
        pageId: page.id,
        handle: page.handle,
        stageName,
        genre,
        spotifyArtistId: selectedArtist?.id ?? null,
        spotifyArtistName: selectedArtist?.name ?? null,
        socialHandles: handles,
        bio: draft.bio,
        avatarUrl: draft.avatarUrl ?? null,
        blocks: draft.suggestedBlocks.map((block) => ({
          tempId: crypto.randomUUID(),
          type: block.type,
          config: block.config,
          keep: true,
        })),
        viberateMatch: draft.viberateMatch,
        viberateConnect: draft.viberateMatch !== null,
      });
    } catch {
      setError("Something went wrong drafting your page — you can try again, or start with a blank page instead.");
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Let&apos;s set up your page</h1>
          <p className="mt-1 text-sm text-white/60">
            We&apos;ll draft a first version for you — you can change everything before it goes live.
          </p>
        </div>
      </div>

      <Input
        label="Artist / stage name"
        placeholder="Your name"
        required
        autoFocus
        value={stageName}
        onChange={(event) => setStageName(event.target.value)}
      />

      <details className="group rounded-2xl border border-white/10 bg-white/[0.03] open:pb-4">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white/70 marker:content-none">
          Speed this up (optional) — link your Spotify or socials
        </summary>
        <div className="flex flex-col gap-4 px-4">
          <Input label="Genre" placeholder="e.g. indie pop" value={genre} onChange={(e) => setGenre(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/60">Spotify artist</span>
            {selectedArtist ? (
              <Card className="flex items-center justify-between py-2">
                <span className="text-sm">{selectedArtist.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArtist(null)}
                  className="text-white/40 hover:text-white"
                  aria-label="Clear selected artist"
                >
                  <X className="size-4" />
                </button>
              </Card>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search Spotify artists"
                    value={spotifyQuery}
                    onChange={(e) => setSpotifyQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSpotifySearch())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    icon={<Search className="size-4" />}
                    loading={spotifySearching}
                    onClick={handleSpotifySearch}
                  >
                    Search
                  </Button>
                </div>
                {spotifyResults.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {spotifyResults.map((artist) => (
                      <Card
                        key={artist.id}
                        interactive
                        className="py-2 text-sm"
                        onClick={() => {
                          setSelectedArtist(artist);
                          setSpotifyResults([]);
                        }}
                      >
                        {artist.name}
                        {artist.genres?.length ? (
                          <span className="ml-2 text-xs text-white/40">{artist.genres[0]}</span>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <Input
                key={platform}
                label={platformLabel[platform]}
                placeholder="handle"
                value={socialHandles[platform] ?? ''}
                onChange={(e) => setSocialHandles((prev) => ({ ...prev, [platform]: e.target.value }))}
              />
            ))}
          </div>
        </div>
      </details>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button size="lg" loading={submitting} disabled={!stageName.trim()} onClick={handleSubmit}>
        Continue
      </Button>
      <button
        type="button"
        onClick={onSkip}
        className="text-center text-sm text-white/40 hover:text-white/70"
      >
        Skip, start with a blank page
      </button>
    </div>
  );
}
