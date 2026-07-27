import type { ArtistIntelligenceProvider } from '@amplifyworld/core';

/**
 * Used until a real Viberate Music Data API key exists (the team currently
 * only holds a Premium Analytics trial, not this API product). Search finds
 * nothing, so nothing in the app ever surfaces a Viberate match — the
 * onboarding wizard, "Connect Viberate" editor action, and daily momentum
 * cron all degrade to exactly their non-Viberate behavior.
 */
export const noopArtistIntelligenceProvider: ArtistIntelligenceProvider = {
  async search() {
    return [];
  },
  async getSnapshot() {
    throw new Error('Viberate integration is not configured (VIBERATE_API_KEY unset).');
  },
};
