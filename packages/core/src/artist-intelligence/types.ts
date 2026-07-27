export type ArtistPlatform =
  | 'spotify'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'soundcloud'
  | 'deezer'
  | 'apple_music'
  | 'beatport'
  | 'shazam';

export interface ArtistIntelligenceMatch {
  externalId: string;
  name: string;
  imageUrl?: string;
}

export interface ArtistIntelligenceSnapshot {
  name: string;
  imageUrl?: string;
  genres: string[];
  /** The provider's own aggregate artist rank/score, if it has one — feeds the momentum engine's external factor. */
  rankScore?: number;
  socialLinks: Partial<Record<ArtistPlatform, string>>;
  platformMetrics: Partial<Record<ArtistPlatform, { followers?: number; rank?: number }>>;
}

/**
 * Contract for a cross-platform artist data provider (starting with
 * Viberate). Distinct from `ProfileImportSource` (Spotify) — a provider here
 * does double duty: one-time profile enrichment *and* an ongoing daily data
 * feed for the momentum scoring engine, not just a one-off import.
 *
 * Search-then-fetch, matching the same shape as `ProfileImportSource` for
 * consistency, but the fetched snapshot is richer (rank score + per-platform
 * metrics) since that's what feeds momentum, not just profile copy.
 */
export interface ArtistIntelligenceProvider {
  search(query: string): Promise<ArtistIntelligenceMatch[]>;
  getSnapshot(externalId: string): Promise<ArtistIntelligenceSnapshot>;
}
