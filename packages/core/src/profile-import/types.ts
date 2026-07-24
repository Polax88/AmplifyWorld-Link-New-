export interface ArtistSearchResult {
  id: string;
  name: string;
  imageUrl?: string;
  genres?: string[];
}

export interface ArtistProfile {
  name: string;
  imageUrl?: string;
  genres?: string[];
  externalUrl: string;
}

/**
 * Contract for importing public artist data from an external DSP/platform
 * (starting with Spotify). Search-then-fetch, not fetch-by-handle — public
 * DSP APIs generally support artist search, not direct handle lookup.
 *
 * No `bio` field here on purpose: DSPs don't expose one. Bio copy always
 * comes from the AiAssistant, never the importer.
 */
export interface ProfileImportSource {
  searchArtists(query: string): Promise<ArtistSearchResult[]>;
  getArtist(id: string): Promise<ArtistProfile>;
}
