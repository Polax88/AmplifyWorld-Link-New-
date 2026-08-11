import { defineTemplate } from '../types';

/**
 * Leads with the merch store — for an artist promoting a merch drop. Shop
 * links come before streaming and socials.
 */
export const merchDropTemplate = defineTemplate({
  key: 'merch-drop',
  displayName: 'Merch Drop',
  description: 'Leads with your merch store, streaming and socials right behind it.',
  isPageTemplate: true,
  blocks: [
    { type: 'link', config: { label: 'Shop merch', url: 'https://example.com/merch', conversionType: 'merch' } },
    { type: 'link', config: { label: 'New drop — limited stock', url: 'https://example.com/merch/new', conversionType: 'merch' } },
    { type: 'social', config: { platform: 'instagram', handle: 'yourhandle', url: 'https://instagram.com/yourhandle' } },
    { type: 'social', config: { platform: 'tiktok', handle: 'yourhandle', url: 'https://tiktok.com/@yourhandle' } },
  ],
});
