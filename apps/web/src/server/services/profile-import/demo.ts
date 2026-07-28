import type { ArtistSearchResult, ProfileImportSource } from '@amplifyworld/core';
import { GENRES, pick } from '../demo/fixtures';

const DEMO_ID_PREFIX = 'demo:';

/**
 * Stands in for the real Spotify client-credentials search in demo mode, so
 * the onboarding wizard's "speed this up → search Spotify" affordance
 * returns convincing results with no real Spotify Developer app. Stateless,
 * same encode-the-name-in-the-id trick as `artist-intelligence/demo.ts`.
 */
export const demoProfileImportSource: ProfileImportSource = {
  async searchArtists(query) {
    const cleaned = query.trim();
    if (!cleaned) return [];

    const names = [cleaned, `${cleaned} Band`];
    return names.map(
      (name): ArtistSearchResult => ({
        id: `${DEMO_ID_PREFIX}${encodeURIComponent(name)}`,
        name,
        genres: [pick(GENRES)],
      }),
    );
  },

  async getArtist(id) {
    const name = id.startsWith(DEMO_ID_PREFIX) ? decodeURIComponent(id.slice(DEMO_ID_PREFIX.length)) : id;
    return {
      name,
      genres: [pick(GENRES)],
      externalUrl: `https://open.spotify.com/artist/${encodeURIComponent(name)}`,
    };
  },
};
