import { describe, expect, it } from 'vitest';
import { classifyDevice, classifySource } from './request-signals';

describe('classifyDevice', () => {
  it('classifies mobile user agents', () => {
    expect(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('mobile');
    expect(classifyDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile')).toBe('mobile');
  });

  it('classifies tablet user agents', () => {
    expect(classifyDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
  });

  it('classifies desktop user agents', () => {
    expect(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Chrome/120.0')).toBe('desktop');
  });

  it('falls back to other for missing/unrecognized UAs', () => {
    expect(classifyDevice(null)).toBe('other');
    expect(classifyDevice('curl/8.0')).toBe('other');
  });
});

describe('classifySource', () => {
  it('treats a missing referer as direct', () => {
    expect(classifySource(null)).toBe('direct');
  });

  it('classifies known social hosts', () => {
    expect(classifySource('https://www.tiktok.com/@artist')).toBe('social');
    expect(classifySource('https://instagram.com/artist')).toBe('social');
  });

  it('classifies known search hosts', () => {
    expect(classifySource('https://www.google.com/search?q=artist')).toBe('search');
  });

  it('classifies everything else as referral', () => {
    expect(classifySource('https://someblog.example.com/post')).toBe('referral');
  });

  it('treats a same-host referer as direct', () => {
    expect(classifySource('https://amplify.world/some-other-page', 'amplify.world')).toBe('direct');
  });

  it('treats an unparseable referer as direct', () => {
    expect(classifySource('not-a-url')).toBe('direct');
  });
});
