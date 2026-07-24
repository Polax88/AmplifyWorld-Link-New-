import { defineTemplate } from '../types';

/**
 * Default fallback used by the onboarding wizard when no Spotify data is
 * available. Tip Jar is included by default (on-by-default, toggleable in
 * the wizard review step) to keep monetization visible from the first draft.
 *
 * The `social` seeds here are slots, not literal blocks to ship as-is: an
 * empty `handle` would fail that block type's own validation (and a fake
 * placeholder handle would be worse — a live page with a made-up Instagram
 * link). The AI assistant's template-only fallback (ai-assistant.ts in
 * apps/web) fills these from the artist's provided handles and drops any
 * slot that has none, rather than including it unmodified.
 */
export const musicianStarterTemplate = defineTemplate({
  key: 'musician-starter',
  displayName: 'Musician starter',
  description: 'Spotify embed, core socials, and a tip jar — the essentials for an artist page.',
  blocks: [
    {
      type: 'embed',
      config: { provider: 'spotify', embedUrl: 'https://open.spotify.com', title: 'Latest release' },
    },
    { type: 'social', config: { platform: 'instagram', handle: '', url: 'https://instagram.com' } },
    { type: 'social', config: { platform: 'tiktok', handle: '', url: 'https://tiktok.com' } },
    { type: 'tip-jar', config: { label: 'Support this artist', checkoutUrl: 'https://example.com/tip' } },
  ],
});
