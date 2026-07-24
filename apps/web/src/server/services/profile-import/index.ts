import type { ProfileImportSource } from '@amplifyworld/core';
import { env } from '../../../env';
import { SpotifyProfileImportSource, noopProfileImportSource } from './spotify';

/** The importer used everywhere in the app. No-ops gracefully when Spotify isn't configured. */
export const profileImportSource: ProfileImportSource =
  env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
    ? new SpotifyProfileImportSource(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET)
    : noopProfileImportSource;
