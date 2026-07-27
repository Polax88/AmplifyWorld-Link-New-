import type { ArtistIntelligenceProvider } from '@amplifyworld/core';
import { noopArtistIntelligenceProvider } from './noop';

/**
 * The Viberate Music Data API client (`viberate.ts`) is deliberately not
 * implemented yet — the team only holds a Premium Analytics trial, not the
 * API product, so there's no `VIBERATE_API_KEY` to build/test it against.
 * Every call site in the app goes through this singleton, so wiring up the
 * real client later is a one-line change here:
 *
 *   import { env } from '../../../env';
 *   import { ViberateProvider } from './viberate';
 *   export const artistIntelligence: ArtistIntelligenceProvider = env.VIBERATE_API_KEY
 *     ? new ViberateProvider(env.VIBERATE_API_KEY)
 *     : noopArtistIntelligenceProvider;
 *
 * — exactly the pattern `profile-import/index.ts` already uses for Spotify.
 */
export const artistIntelligence: ArtistIntelligenceProvider = noopArtistIntelligenceProvider;
