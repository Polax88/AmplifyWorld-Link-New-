import { defineTemplate } from '../types';

/**
 * Leads with ticket links — for an artist promoting a tour or upcoming
 * shows. Ticket/tour links come before streaming and socials.
 */
export const tourDatesTemplate = defineTemplate({
  key: 'tour-dates',
  displayName: 'Tour Dates',
  description: 'Leads with ticket links for upcoming shows, streaming and socials right behind.',
  isPageTemplate: true,
  blocks: [
    { type: 'link', config: { label: 'Get tickets', url: 'https://example.com/tickets', conversionType: 'ticket' } },
    { type: 'link', config: { label: 'Tour dates & venues', url: 'https://example.com/tour', conversionType: 'ticket' } },
    { type: 'social', config: { platform: 'spotify', handle: 'yourhandle', url: 'https://open.spotify.com/artist/yourhandle' } },
    { type: 'social', config: { platform: 'instagram', handle: 'yourhandle', url: 'https://instagram.com/yourhandle' } },
  ],
});
