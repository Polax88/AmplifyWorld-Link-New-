import { prisma, type Prisma } from '@amplifyworld/database';
import type { ArtistIntelligenceSnapshot } from '@amplifyworld/core';
import { artistIntelligence } from './index';

function todayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Fetches a fresh Viberate snapshot for a page and upserts today's row.
 * Deliberately does NOT swallow errors — callers decide whether a failure
 * should be silent (the wizard's background match attempt, the daily cron)
 * or surfaced (the explicit "Connect Viberate" action, where the artist
 * should know if their pick didn't work).
 */
export async function syncViberateSnapshot(pageId: string, externalId: string): Promise<ArtistIntelligenceSnapshot> {
  const snapshot = await artistIntelligence.getSnapshot(externalId);
  const date = todayUtcDate();

  await prisma.viberateSnapshot.upsert({
    where: { pageId_date: { pageId, date } },
    create: {
      pageId,
      date,
      rankScore: snapshot.rankScore ?? null,
      profile: snapshot as unknown as Prisma.InputJsonValue,
    },
    update: {
      rankScore: snapshot.rankScore ?? null,
      profile: snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  return snapshot;
}
