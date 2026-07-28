import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@amplifyworld/database';
import { FAN_FIRST_NAMES, FAN_LAST_NAMES, pick, randInt, randomToken } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHECKED_IN_RATIO_MIN = 0.25;
const CHECKED_IN_RATIO_MAX = 0.4;

/**
 * Seeds fictional holders for a freshly-created Pass — same "never open to
 * an empty state" convention as `generateFans`/`ensureDiscoverRosterSeeded`.
 * Fresh `Fan` rows (not reused from the page's existing `FanSubscription`
 * fans) since a pass's audience is conceptually its own thing (e.g. people
 * who scanned a physical flyer), not necessarily existing page subscribers.
 */
export async function generatePassHolders(passId: string, count = randInt(8, 20)): Promise<void> {
  const fans = Array.from({ length: count }, () => {
    const first = pick(FAN_FIRST_NAMES);
    const last = pick(FAN_LAST_NAMES);
    return { id: randomUUID(), email: `${first.toLowerCase()}.${last.toLowerCase()}.${randomToken(6)}@example.com` };
  });
  await prisma.fan.createMany({ data: fans });

  const checkedInRatio = CHECKED_IN_RATIO_MIN + Math.random() * (CHECKED_IN_RATIO_MAX - CHECKED_IN_RATIO_MIN);
  const holders: Prisma.PassHolderCreateManyInput[] = fans.map((fan) => {
    const claimedAt = new Date(Date.now() - randInt(0, 14) * DAY_MS);
    const checkedIn = Math.random() < checkedInRatio;
    return {
      passId,
      fanId: fan.id,
      claimedAt,
      checkedInAt: checkedIn ? new Date(claimedAt.getTime() + randInt(0, 12) * 60 * 60 * 1000) : null,
    };
  });

  await prisma.passHolder.createMany({ data: holders });
}
