import { NextResponse, type NextRequest } from 'next/server';
import { VISITOR_COOKIE } from './lib/visitor-cookie';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Kept DB-free (Prisma doesn't run on the Edge runtime) — this only ensures
 * every visitor to a public page carries a stable anonymous id. Actual event
 * writes happen server-side in the page/route handlers, which read this
 * cookie back via request-signals.ts.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(VISITOR_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}

export const config = {
  // Public/marketing routes only — exclude dashboard/auth/api/static so this
  // never runs on authenticated traffic.
  matcher: ['/((?!api|login|dashboard|_next|favicon.ico).*)'],
};
