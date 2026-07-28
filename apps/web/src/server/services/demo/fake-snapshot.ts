import type { ArtistIntelligenceSnapshot } from '@amplifyworld/core';
import { randInt, slugify } from './fixtures';

/**
 * Builds a plausible fake Viberate cross-platform snapshot for a given
 * artist name. `progress` (0-1) scales follower counts up for a more
 * "established" look — used when generating a trending history; omit it
 * (defaults to 1) for a one-off connect (e.g. `ConnectPlatformsCard`).
 */
export function buildFakeArtistSnapshot(
  name: string,
  genre: string,
  rankScore: number,
  progress = 1,
): ArtistIntelligenceSnapshot {
  const slug = slugify(name);
  const followerBase = 4_000 + Math.round(progress * 3_000);
  return {
    name,
    genres: [genre],
    rankScore,
    socialLinks: {
      spotify: `https://open.spotify.com/artist/${slug}`,
      instagram: `https://instagram.com/${slug}`,
      tiktok: `https://tiktok.com/@${slug}`,
      youtube: `https://youtube.com/@${slug}`,
    },
    platformMetrics: {
      spotify: { followers: followerBase, rank: randInt(1, 500) },
      instagram: { followers: Math.round(followerBase * 1.4), rank: randInt(1, 500) },
      tiktok: { followers: Math.round(followerBase * 2.1), rank: randInt(1, 500) },
      youtube: { followers: Math.round(followerBase * 0.6), rank: randInt(1, 500) },
    },
  };
}
