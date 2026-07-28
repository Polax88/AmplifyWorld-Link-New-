import type { ArtistPlatform } from '@amplifyworld/core';

export const ARTIST_NAMES = [
  'Nova Sound',
  'Echo Static',
  'Velvet Horizon',
  'Paper Moth',
  'Glass Canyon',
  'Midnight Runner',
  'Coral Static',
  'Lunar Habits',
  'Amber Rivers',
  'Ghost Season',
  'Wild Signal',
  'Sable & Stone',
] as const;

export const GENRES = [
  'indie pop',
  'bedroom pop',
  'alt R&B',
  'synthwave',
  'indie folk',
  'dream pop',
  'lo-fi hip hop',
  'electro-pop',
] as const;

export const COUNTRIES = ['US', 'GB', 'DE', 'BR', 'JP', 'AU', 'CA', 'FR', 'MX', 'NL', 'SE', 'KR'] as const;

export const SOURCE_WEIGHTS: Record<string, number> = { direct: 0.35, social: 0.4, search: 0.15, referral: 0.1 };

export const DEVICE_TYPES = ['mobile', 'desktop', 'tablet'] as const;

export const FAN_FIRST_NAMES = [
  'Alex',
  'Jordan',
  'Sam',
  'Morgan',
  'Casey',
  'Riley',
  'Taylor',
  'Jamie',
  'Avery',
  'Rowan',
  'Skyler',
  'Quinn',
  'Reese',
  'Emerson',
  'Dakota',
] as const;

export const FAN_LAST_NAMES = [
  'Rivera',
  'Chen',
  'Okafor',
  'Nguyen',
  'Andersson',
  'Kowalski',
  'Silva',
  'Haddad',
  'Kim',
  'Dubois',
  'Nakamura',
  'Costa',
] as const;

/** Word banks combined into synthetic band names for Discover's fictional artist roster. */
export const ROSTER_NAME_PREFIXES = [
  'Neon',
  'Velvet',
  'Paper',
  'Glass',
  'Amber',
  'Coral',
  'Lunar',
  'Wild',
  'Echo',
  'Golden',
  'Iron',
  'Silver',
] as const;

export const ROSTER_NAME_SUFFIXES = [
  'Atlas',
  'Horizon',
  'Static',
  'Season',
  'Habits',
  'Rivers',
  'Signal',
  'Ember',
  'Canyon',
  'Runner',
  'Bloom',
  'Tide',
] as const;

/** Platforms every demo artist gets a "connected" social block for, plus a plausible handle template. */
export const DEMO_SOCIAL_PLATFORMS: ArtistPlatform[] = [
  'spotify',
  'instagram',
  'tiktok',
  'youtube',
] as const satisfies ArtistPlatform[];

export function pick<T>(pool: readonly T[]): T {
  const item = pool[Math.floor(Math.random() * pool.length)];
  if (item === undefined) throw new Error('pick() called on an empty pool');
  return item;
}

export function pickN<T>(pool: readonly T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomToken(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
