export interface AnalyticsEventInput {
  type: 'PAGE_VIEW' | 'BLOCK_CLICK' | 'FAN_SUBSCRIBED' | 'CUSTOM';
  pageId: string;
  blockId?: string;
  fanId?: string;
  metadata?: Record<string, unknown>;
  /** Request-derived signals (see analytics/request-signals.ts) that feed the momentum scoring engine. */
  country?: string;
  deviceType?: string;
  source?: string;
  visitorId?: string;
}

/**
 * A destination analytics events are sent to. The default implementation
 * (in `apps/web`) writes to `AnalyticsEvent` in Postgres. Additional
 * providers (PostHog, Segment, a data warehouse) can be added later by
 * implementing this interface and registering them in `CompositeTracker`
 * below — call sites never change.
 */
export interface AnalyticsTracker {
  track(event: AnalyticsEventInput): Promise<void>;
}

/** Fans out one tracked event to every registered provider. */
export class CompositeTracker implements AnalyticsTracker {
  constructor(private readonly providers: AnalyticsTracker[]) {}

  async track(event: AnalyticsEventInput): Promise<void> {
    await Promise.all(this.providers.map((provider) => provider.track(event)));
  }
}
