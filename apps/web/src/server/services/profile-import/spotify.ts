import type { ArtistProfile, ArtistSearchResult, ProfileImportSource } from '@amplifyworld/core';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string }>;
  external_urls: { spotify: string };
}

/**
 * Spotify Web API client-credentials implementation — app-level auth (no
 * per-artist OAuth needed) since we're only reading public artist data.
 */
export class SpotifyProfileImportSource implements ProfileImportSource {
  private cachedToken: CachedToken | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.accessToken;
    }

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) {
      throw new Error(`Spotify token request failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
    };
    return this.cachedToken.accessToken;
  }

  async searchArtists(query: string): Promise<ArtistSearchResult[]> {
    const token = await this.getAccessToken();
    const url = new URL(`${API_BASE}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'artist');
    url.searchParams.set('limit', '5');

    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = (await response.json()) as { artists: { items: SpotifyArtist[] } };
    return data.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      genres: artist.genres,
    }));
  }

  async getArtist(id: string): Promise<ArtistProfile> {
    const token = await this.getAccessToken();
    const response = await fetch(`${API_BASE}/artists/${id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Spotify artist lookup failed: ${response.status}`);
    }

    const artist = (await response.json()) as SpotifyArtist;
    return {
      name: artist.name,
      imageUrl: artist.images[0]?.url,
      genres: artist.genres,
      externalUrl: artist.external_urls.spotify,
    };
  }
}

/** Used when Spotify isn't configured — the wizard's search affordance just finds nothing. */
export const noopProfileImportSource: ProfileImportSource = {
  async searchArtists() {
    return [];
  },
  async getArtist() {
    throw new Error('Spotify import is not configured (SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET unset).');
  },
};
