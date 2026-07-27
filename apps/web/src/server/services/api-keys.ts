import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@amplifyworld/database';

const KEY_PREFIX = 'ami_';

function hashKey(plaintextKey: string): string {
  return createHash('sha256').update(plaintextKey).digest('hex');
}

/**
 * Creates a new API key for the read-only momentum API. Only the hash is
 * ever stored — the plaintext is returned once, here, and never again
 * (same pattern as a GitHub personal access token).
 */
export async function createApiKey(label: string): Promise<{ id: string; plaintextKey: string }> {
  const plaintextKey = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`;
  const record = await prisma.apiKey.create({ data: { label, hashedKey: hashKey(plaintextKey) } });
  return { id: record.id, plaintextKey };
}

/**
 * Verifies a bearer key from an inbound API request. Returns null for a
 * missing, unrecognized, or revoked key. Touches `lastUsedAt` on success —
 * fire-and-forget, never blocks or fails the request it's authenticating.
 */
export async function verifyApiKey(plaintextKey: string): Promise<{ id: string; label: string } | null> {
  const record = await prisma.apiKey.findUnique({ where: { hashedKey: hashKey(plaintextKey) } });
  if (!record || record.revokedAt) return null;

  void prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { id: record.id, label: record.label };
}

/** Extracts and verifies the `Authorization: Bearer <key>` header from an inbound REST API request. */
export async function authenticateApiRequest(request: Request): Promise<{ id: string; label: string } | null> {
  const authHeader = request.headers.get('authorization');
  const match = authHeader?.match(/^Bearer (.+)$/);
  const token = match?.[1];
  if (!token) return null;
  return verifyApiKey(token);
}
