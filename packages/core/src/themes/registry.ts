import type { ThemePreset } from './types';

/**
 * Curated theme presets. Two free (on by default for every page), three
 * premium (unlocked by spending $AMPS — see apps/web's `amps.unlockTheme`).
 * Adding a preset is additive: no migration, `Page.theme` just stores its
 * `key`.
 */
export const THEME_PRESETS: ThemePreset[] = [
  { key: 'brand-pink', displayName: 'Brand pink', accentColor: '#ff4081', isPremium: false, ampsCost: 0 },
  { key: 'midnight', displayName: 'Midnight', accentColor: '#7c8cff', isPremium: false, ampsCost: 0 },
  { key: 'sunset', displayName: 'Sunset', accentColor: '#ff8a3d', isPremium: true, ampsCost: 250 },
  { key: 'ocean', displayName: 'Ocean', accentColor: '#22d3ee', isPremium: true, ampsCost: 400 },
  { key: 'violet', displayName: 'Violet', accentColor: '#a855f7', isPremium: true, ampsCost: 600 },
];

const DEFAULT_PRESET = THEME_PRESETS[0]!;

export function getThemePreset(key: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? DEFAULT_PRESET;
}
