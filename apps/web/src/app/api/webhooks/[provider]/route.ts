import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@amplifyworld/database';
import { domainEvents } from '@amplifyworld/core';
import { env } from '../../../../env';

/**
 * Generic inbound webhook receiver for external AmplifyWorld services
 * (fanwallet, hedera-api, stake, ...). Each provider posts here with an
 * `x-amplifyworld-signature` header (HMAC-SHA256 of the raw body, keyed by
 * that connection's stored secret). On success it flips the matching
 * `IntegrationConnection` to ACTIVE and emits `integration.connected` so
 * the rest of the app (dashboard, gated-content blocks) can react.
 *
 * This handler intentionally does not interpret provider-specific payload
 * shapes beyond `{ ownerId, externalId }` — provider-specific logic belongs
 * in that provider's own service, not here.
 */
const PROVIDERS = new Set(['hedera', 'fanwallet', 'staking']);

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }

  const signatureHeader = request.headers.get('x-amplifyworld-signature');
  const rawBody = await request.text();
  if (!signatureHeader || !verifySignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { ownerId: string; externalId: string };
  const providerKey = provider.toUpperCase() as 'HEDERA' | 'FANWALLET' | 'STAKING';

  const connection = await prisma.integrationConnection.upsert({
    where: { ownerId_provider: { ownerId: body.ownerId, provider: providerKey } },
    create: { ownerId: body.ownerId, provider: providerKey, externalId: body.externalId, status: 'ACTIVE' },
    update: { externalId: body.externalId, status: 'ACTIVE' },
  });

  await domainEvents.publish(
    'integration.connected',
    { ownerId: body.ownerId, provider: providerKey, integrationConnectionId: connection.id },
    new Date().toISOString(),
  );

  return NextResponse.json({ success: true });
}

function verifySignature(rawBody: string, signature: string): boolean {
  const expected = createHmac('sha256', env.INTEGRATION_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
}
