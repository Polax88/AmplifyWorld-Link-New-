import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '../../../../../server/services/api-keys';
import { getLeaderboard } from '../../../../../server/services/momentum-queries';

/**
 * Read-only Artist Momentum Index API — v1. `Authorization: Bearer <key>`
 * required (see `/dashboard/admin/api-keys` for issuing keys). No rate
 * limiting/tiering yet — this is a v1 read endpoint for early partners.
 */
export async function GET(request: Request) {
  const key = await authenticateApiRequest(request);
  if (!key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(await getLeaderboard());
}
