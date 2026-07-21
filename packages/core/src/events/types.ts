/**
 * Domain events emitted by the app. These are the seam the rest of the
 * AmplifyWorld ecosystem (fanwallet, hedera-api, stake) integrates with —
 * via the webhook dispatcher in `apps/web`, which looks up
 * `WebhookSubscription` rows and POSTs the matching events. Adding a new
 * event is additive: append a variant here, emit it where it happens, done.
 */
export interface DomainEventMap {
  'page.published': { pageId: string; handle: string };
  'page.unpublished': { pageId: string; handle: string };
  'block.clicked': { pageId: string; blockId: string; blockType: string; fanId?: string };
  'fan.subscribed': { pageId: string; fanId: string };
  'integration.connected': { ownerId: string; provider: string; integrationConnectionId: string };
}

export type DomainEventName = keyof DomainEventMap;

export interface DomainEvent<TName extends DomainEventName = DomainEventName> {
  name: TName;
  payload: DomainEventMap[TName];
  occurredAt: string; // ISO timestamp, set by the caller (no Date.now() inside core)
}
