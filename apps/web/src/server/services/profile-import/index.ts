import type { ProfileImportSource } from '@amplifyworld/core';
import { env } from '../../../env';
import { SpotifyProfileImportSource, noopProfileImportSource } from './spotify';
import { demoProfileImportSource } from './demo';

/**
 * The importer used everywhere in the app. `DEMO_MODE` takes priority (a
 * demo deployment never has a real Spotify Developer app anyway); otherwise
 * no-ops gracefully when Spotify isn't configured.
 */
export const profileImportSource: ProfileImportSource = env.DEMO_MODE
  ? demoProfileImportSource
  : env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
    ? new SpotifyProfileImportSource(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET)
    : noopProfileImportSource;
