import { headers, cookies } from 'next/headers';
import { classifyDevice, classifySource } from '@amplifyworld/core';
import { VISITOR_COOKIE } from '../../lib/visitor-cookie';

export interface RequestSignals {
  country?: string;
  deviceType: string;
  source: string;
  visitorId?: string;
}

/**
 * Derives the momentum-scoring signals (country/device/source/visitorId)
 * from the current request. Usable from Server Components and Route
 * Handlers — anywhere `next/headers` is readable. Never touches raw IP:
 * country comes pre-resolved from Vercel's edge geolocation header.
 */
export async function getRequestSignals(): Promise<RequestSignals> {
  const headerList = await headers();
  const cookieList = await cookies();

  const userAgent = headerList.get('user-agent');
  const referer = headerList.get('referer');
  const host = headerList.get('host') ?? undefined;
  // Set by Vercel's edge network for every request; absent in local dev.
  const country = headerList.get('x-vercel-ip-country') ?? undefined;
  const visitorId = cookieList.get(VISITOR_COOKIE)?.value;

  return {
    country,
    deviceType: classifyDevice(userAgent),
    source: classifySource(referer, host),
    visitorId,
  };
}
