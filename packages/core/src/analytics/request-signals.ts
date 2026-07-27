export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other';

export type TrafficSource = 'direct' | 'social' | 'search' | 'referral';

const SOCIAL_HOSTS = [
  'instagram.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  't.co',
  'facebook.com',
  'fb.com',
  'linkedin.com',
  'threads.net',
  'snapchat.com',
  'reddit.com',
  'pinterest.com',
];

const SEARCH_HOSTS = ['google.', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'baidu.com'];

/** Classifies a User-Agent string. Deliberately simple — no external deps, good enough to bucket traffic. */
export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return 'other';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android/.test(ua)) return 'mobile';
  if (/mozilla|chrome|safari|firefox|edg|opr/.test(ua)) return 'desktop';
  return 'other';
}

/** Classifies where a visit came from, given the Referer header. No Referer at all means the link was opened directly (typed, DM, QR, bio link tap). */
export function classifySource(referer: string | null | undefined, pageHost?: string): TrafficSource {
  if (!referer) return 'direct';

  let host: string;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return 'direct';
  }

  if (pageHost && host === pageHost.toLowerCase()) return 'direct';
  if (SOCIAL_HOSTS.some((social) => host === social || host.endsWith(`.${social}`))) return 'social';
  if (SEARCH_HOSTS.some((search) => host.includes(search))) return 'search';
  return 'referral';
}
