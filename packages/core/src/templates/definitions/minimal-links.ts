import { defineTemplate } from '../types';

/**
 * The plainest of the 4 free-tier page templates — a simple stack of links
 * with no particular promotional lead. Good default for an artist who just
 * wants a tidy link-in-bio page without a specific release/tour/merch push.
 */
export const minimalLinksTemplate = defineTemplate({
  key: 'minimal-links',
  displayName: 'Minimal Links',
  description: 'A clean, simple list of your essential links — no particular emphasis.',
  isPageTemplate: true,
  blocks: [
    { type: 'link', config: { label: 'Listen to my music', url: 'https://open.spotify.com' } },
    { type: 'link', config: { label: 'My website', url: 'https://example.com' } },
    { type: 'social', config: { platform: 'instagram', handle: 'yourhandle', url: 'https://instagram.com/yourhandle' } },
    { type: 'social', config: { platform: 'tiktok', handle: 'yourhandle', url: 'https://tiktok.com/@yourhandle' } },
  ],
});
