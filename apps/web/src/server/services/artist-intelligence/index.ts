import type { ArtistIntelligenceProvider } from '@amplifyworld/core';
import { isDemoMode } from '../../../env';
import { noopArtistIntelligenceProvider } from './noop';
import { demoArtistIntelligenceProvider } from './demo';

/**
 * The Viberate Music Data API client (`viberate.ts`) is deliberately not
 * implemented yet — the team only holds a Premium Analytics trial, not the
 * API product, so there's no `VIBERATE_API_KEY` to build/test it against.
 * Every call site in the app goes through this singleton, so wiring up the
 * real client later is a one-line change here:
 *
 *   import { ViberateProvider } from './viberate';
 *   export const artistIntelligence: ArtistIntelligenceProvider = env.VIBERATE_API_KEY
 *     ? new ViberateProvider(env.VIBERATE_API_KEY)
 *     : noopArtistIntelligenceProvider;
 *
 * — exactly the pattern `profile-import/index.ts` already uses for Spotify.
 * `DEMO_MODE` takes priority over both — a demo deployment never has a real
 * key anyway, and the swap is explicit/intentional rather than incidental.
 */
export const artistIntelligence: ArtistIntelligenceProvider = isDemoMode
  ? demoArtistIntelligenceProvider
  : noopArtistIntelligenceProvider;
