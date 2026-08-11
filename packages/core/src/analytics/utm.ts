/**
 * Automatic UTM tagging for smart links — every `link`/`social` block gets
 * `utm_source`/`utm_medium`/`utm_campaign` derived from the block's platform
 * (or conversion type, for a generic `link` block with no platform) and the
 * page's own slug, with no per-link setup required. A link that already
 * carries its own `utm_*` params (an artist pasting a pre-tagged URL) is
 * left alone — this only fills in what's missing.
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
}

/** Fixed medium for every AmplifyWorld Link smart link — the traffic always originates from the same kind of surface. */
const UTM_MEDIUM = 'link_in_bio';

export function buildUtmParams(source: string, pageHandle: string): UtmParams {
  return { source: slugifyUtmValue(source), medium: UTM_MEDIUM, campaign: slugifyUtmValue(pageHandle) };
}

/**
 * Appends `utm` to `url`'s query string, never overwriting a param the
 * artist already set explicitly. Never throws on a malformed URL — a smart
 * link still has to render and be clickable even if this can't parse it.
 */
export function appendUtmParams(url: string, utm: UtmParams): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!parsed.searchParams.has('utm_source')) parsed.searchParams.set('utm_source', utm.source);
  if (!parsed.searchParams.has('utm_medium')) parsed.searchParams.set('utm_medium', utm.medium);
  if (!parsed.searchParams.has('utm_campaign')) parsed.searchParams.set('utm_campaign', utm.campaign);
  return parsed.toString();
}

export function hasUtmParams(url: string): boolean {
  try {
    return new URL(url).searchParams.has('utm_source');
  } catch {
    return false;
  }
}

function slugifyUtmValue(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'other';
}
