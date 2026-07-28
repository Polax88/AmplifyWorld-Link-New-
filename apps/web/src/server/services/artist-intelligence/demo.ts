import type { ArtistIntelligenceMatch, ArtistIntelligenceProvider } from '@amplifyworld/core';
import { GENRES, pick, randInt } from '../demo/fixtures';
import { buildFakeArtistSnapshot } from '../demo/fake-snapshot';

const DEMO_ID_PREFIX = 'demo:';

/**
 * Stands in for the real Viberate client in demo mode. Stateless — the
 * artist name is encoded straight into the match's `externalId` so
 * `getSnapshot` can reconstruct a consistent result later without any
 * server-side lookup table.
 */
export const demoArtistIntelligenceProvider: ArtistIntelligenceProvider = {
  async search(query) {
    const cleaned = query.trim();
    if (!cleaned) return [];

    const names = [cleaned, `${cleaned} Official`];
    return names.map(
      (name): ArtistIntelligenceMatch => ({ externalId: `${DEMO_ID_PREFIX}${encodeURIComponent(name)}`, name }),
    );
  },

  async getSnapshot(externalId) {
    const name = externalId.startsWith(DEMO_ID_PREFIX)
      ? decodeURIComponent(externalId.slice(DEMO_ID_PREFIX.length))
      : externalId;
    return buildFakeArtistSnapshot(name, pick(GENRES), randInt(55, 92));
  },
};
