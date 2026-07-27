import { NextResponse } from 'next/server';
import { authenticateApiRequest } from '../../../../../../server/services/api-keys';
import { getPageMomentumByHandle } from '../../../../../../server/services/momentum-queries';

/** Read-only Artist Momentum Index API — v1. Only ever returns data for published pages. */
export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const key = await authenticateApiRequest(request);
  if (!key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { handle } = await params;
  const result = await getPageMomentumByHandle(handle);
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}
