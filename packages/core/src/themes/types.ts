import { z } from 'zod';

/**
 * One selectable page theme. `accentColor` is a CSS color value applied via
 * a `--theme-accent` custom property (see apps/web's PagePreview/public page
 * renderer) — kept to a small curated set rather than a free-form color
 * picker, the same "registry of known-good options" pattern as blocks and
 * templates.
 */
export interface ThemePreset {
  key: string;
  displayName: string;
  accentColor: string;
  isPremium: boolean;
  /** $AMPS cost to unlock — 0 for free presets, ignored otherwise. */
  ampsCost: number;
}

export const pageThemeSchema = z.object({
  themeKey: z.string().default('brand-pink'),
  layout: z.enum(['standard', 'compact']).default('standard'),
});

export type PageThemeConfig = z.infer<typeof pageThemeSchema>;
