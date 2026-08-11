import { describe, expect, it } from 'vitest';
import { appendUtmParams, buildUtmParams, hasUtmParams } from './utm';
import { isConversionMetadata } from './conversion-types';

describe('buildUtmParams', () => {
  it('derives source/medium/campaign from the platform and page slug', () => {
    const utm = buildUtmParams('instagram', 'nova-sound');
    expect(utm).toEqual({ source: 'instagram', medium: 'link_in_bio', campaign: 'nova_sound' });
  });

  it('slugifies values with spaces/punctuation into a safe utm value', () => {
    const utm = buildUtmParams('Pre-Save!', 'Nova Sound');
    expect(utm.source).toBe('pre_save');
    expect(utm.campaign).toBe('nova_sound');
  });
});

describe('appendUtmParams', () => {
  it('appends utm_source/medium/campaign to a plain URL', () => {
    const url = appendUtmParams('https://open.spotify.com/artist/123', buildUtmParams('spotify', 'nova-sound'));
    expect(url).toContain('utm_source=spotify');
    expect(url).toContain('utm_medium=link_in_bio');
    expect(url).toContain('utm_campaign=nova_sound');
  });

  it('never overwrites a utm param the artist already set explicitly', () => {
    const url = appendUtmParams(
      'https://example.com/tickets?utm_source=newsletter',
      buildUtmParams('ticket', 'nova-sound'),
    );
    expect(url).toContain('utm_source=newsletter');
    expect(url).toContain('utm_campaign=nova_sound');
  });

  it('returns the original string for a malformed URL instead of throwing', () => {
    expect(appendUtmParams('not a url', buildUtmParams('ticket', 'nova-sound'))).toBe('not a url');
  });
});

describe('hasUtmParams', () => {
  it('detects an existing utm_source', () => {
    expect(hasUtmParams('https://example.com?utm_source=x')).toBe(true);
    expect(hasUtmParams('https://example.com')).toBe(false);
    expect(hasUtmParams('not a url')).toBe(false);
  });
});

describe('isConversionMetadata', () => {
  it('is true only for a known, non-generic conversionType', () => {
    expect(isConversionMetadata({ conversionType: 'ticket' })).toBe(true);
    expect(isConversionMetadata({ conversionType: 'generic' })).toBe(false);
    expect(isConversionMetadata({ conversionType: 'not-a-real-type' })).toBe(false);
    expect(isConversionMetadata({})).toBe(false);
    expect(isConversionMetadata(null)).toBe(false);
    expect(isConversionMetadata('ticket')).toBe(false);
  });
});
