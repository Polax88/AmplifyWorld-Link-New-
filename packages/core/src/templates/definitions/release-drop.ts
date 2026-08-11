import { defineTemplate } from '../types';

/**
 * Leads with the new single and a pre-save link — for an artist promoting a
 * fresh release. Block order is the whole point of this template: the embed
 * and pre-save link come before anything else.
 */
export const releaseDropTemplate = defineTemplate({
  key: 'release-drop',
  displayName: 'Release Drop',
  description: 'Leads with your new single and a pre-save link, streaming links right behind it.',
  isPageTemplate: true,
  blocks: [
    { type: 'embed', config: { provider: 'spotify', embedUrl: 'https://open.spotify.com', title: 'New single' } },
    { type: 'link', config: { label: 'Pre-save the new single', url: 'https://example.com/presave', conversionType: 'pre_save' } },
    { type: 'link', config: { label: 'Listen on Apple Music', url: 'https://music.apple.com', conversionType: 'stream' } },
    { type: 'social', config: { platform: 'instagram', handle: 'yourhandle', url: 'https://instagram.com/yourhandle' } },
    { type: 'social', config: { platform: 'tiktok', handle: 'yourhandle', url: 'https://tiktok.com/@yourhandle' } },
  ],
});
