import { prisma, type Prisma } from '@amplifyworld/database';
import { CompositeTracker, type AnalyticsTracker } from '@amplifyworld/core';

const databaseTracker: AnalyticsTracker = {
  async track(event) {
    await prisma.analyticsEvent.create({
      data: {
        type: event.type,
        pageId: event.pageId,
        blockId: event.blockId,
        fanId: event.fanId,
        metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  },
};

/**
 * Add further providers (PostHog, a warehouse export, etc.) to this array —
 * every call site uses the composite tracker and never needs to know how
 * many destinations an event fans out to.
 */
export const analytics = new CompositeTracker([databaseTracker]);
