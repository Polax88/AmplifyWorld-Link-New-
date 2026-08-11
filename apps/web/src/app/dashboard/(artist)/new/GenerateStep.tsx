'use client';

import { useState } from 'react';
import { Search, Wand2, X } from 'lucide-react';
import type { ArtistSearchResult } from '@amplifyworld/core';
import { Button, Card, Input } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { platformLabel } from '../../../../components/blocks/SocialBlockView';
import { SOCIAL_PLATFORMS, type GeneratedPage } from './types';

/**
 * Shown while the 3 chained mutations below run, so a ~1-2s wait reads as
 * deliberate work rather than a stall. Purely cosmetic — the index just
 * tracks which mutation is currently in flight.
 */
const GENERATE_STAGES = ['Setting up your page…', 'Writing your bio & picking your links…', 'Publishing your blocks…'] as const;

/**
 * The wizard's single required step: a stage name and one click. Chains
 * `onboarding.start` → `onboarding.draft` → `onboarding.commit` itself,
 * auto-accepting the AI's suggested bio/blocks/Viberate match rather than
 * pausing for a per-item review — that review now happens on the live,
 * already-published-ready page in `ReadyStep`, which is easier to trust
 * than a pre-commit draft anyway. The optional Spotify/genre/socials
 * fields only ever make the same one click produce a more accurate page —
 * they're never required.
 */
export function GenerateStep({
  onComplete,
  onSkip,
}: {
  onComplete: (page: GeneratedPage) => void;
  onSkip: () => void;
}) {
  const utils = trpc.useUtils();
  const startMutation = trpc.onboarding.start.useMutation();
  const draftMutation = trpc.onboarding.draft.useMutation();
  const commitMutation = trpc.onboarding.commit.useMutation();

  const [stageName, setStageName] = useState('');
  const [genre, setGenre] = useState('');
  const [socialHandles, setSocialHandles] = useState<Record<string, string>>({});

  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<ArtistSearchResult[]>([]);
  const [spotifySearching, setSpotifySearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const submitting = startMutation.isPending || draftMutation.isPending || commitMutation.isPending;

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

  async function handleGenerate() {
    if (!stageName.trim()) return;
    setError(null);
    setStageIndex(0);

    const handles = Object.entries(socialHandles)
      .filter(([, handle]) => handle.trim())
      .map(([platform, handle]) => ({ platform, handle: handle.trim() }));

    try {
      const page = await startMutation.mutateAsync({ stageName });

      setStageIndex(1);
      const draft = await draftMutation.mutateAsync({
        pageId: page.id,
        stageName,
        genre: genre.trim() || undefined,
        spotifyArtistId: selectedArtist?.id,
        socialHandles: handles.length > 0 ? handles : undefined,
      });

      setStageIndex(2);
      await commitMutation.mutateAsync({
        pageId: page.id,
        bio: draft.bio,
        avatarUrl: draft.avatarUrl ?? undefined,
        blocks: draft.suggestedBlocks.map((block) => ({ type: block.type, config: block.config })),
        viberateExternalId: draft.viberateMatch?.externalId,
      });

      onComplete({ pageId: page.id, handle: page.handle });
    } catch {
      setError('Something went wrong generating your page — you can try again, or start with a blank page instead.');
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Wand2 className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink">Generate your page</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your name and click once — we&apos;ll write your bio, pick your links, and publish a live page.
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
        disabled={submitting}
      />

      <details className="group rounded-2xl border border-white/8 bg-white/[0.025] open:pb-4">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink-muted marker:content-none">
          Speed this up (optional) — link your Spotify or socials
        </summary>
        <div className="flex flex-col gap-4 px-4">
          <Input label="Genre" placeholder="e.g. indie pop" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={submitting} />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-muted">Spotify artist</span>
            {selectedArtist ? (
              <Card className="flex items-center justify-between py-2">
                <span className="text-sm text-ink">{selectedArtist.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArtist(null)}
                  className="text-ink-faint hover:text-ink"
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
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    icon={<Search className="size-4" />}
                    loading={spotifySearching}
                    disabled={submitting}
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
                          <span className="ml-2 text-xs text-ink-faint">{artist.genres[0]}</span>
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
                disabled={submitting}
              />
            ))}
          </div>
        </div>
      </details>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button size="lg" loading={submitting} disabled={!stageName.trim()} onClick={handleGenerate}>
        {submitting ? GENERATE_STAGES[stageIndex] : 'Generate my page'}
      </Button>
      <button
        type="button"
        onClick={onSkip}
        disabled={submitting}
        className="text-center text-sm text-ink-faint hover:text-ink-muted disabled:pointer-events-none disabled:opacity-50"
      >
        Skip, start with a blank page
      </button>
    </div>
  );
}
