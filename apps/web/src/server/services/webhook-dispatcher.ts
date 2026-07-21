import { createHmac } from 'node:crypto';
import { prisma } from '@amplifyworld/database';
import { domainEvents, type DomainEventName } from '@amplifyworld/core';

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Bridges the in-process domain event bus to external systems. Any
 * `WebhookSubscription` row whose `events` array includes the event name
 * receives an HMAC-signed POST — this is how fanwallet/hedera-api/stake (or
 * anything else) can react to what happens in this app without this app
 * knowing they exist.
 */
async function dispatch(eventName: DomainEventName, payload: unknown, occurredAt: string) {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { isActive: true, events: { has: eventName } },
  });

  const body = JSON.stringify({ event: eventName, payload, occurredAt });

  await Promise.allSettled(
    subscriptions.map((subscription) =>
      fetch(subscription.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-amplifyworld-signature': sign(subscription.secret, body),
        },
        body,
      }),
    ),
  );
}

const WEBHOOK_EVENT_NAMES: DomainEventName[] = [
  'page.published',
  'page.unpublished',
  'block.clicked',
  'fan.subscribed',
  'integration.connected',
];

/** Call once at app bootstrap (see `bootstrap.ts`). */
export function registerWebhookDispatcher(): void {
  for (const eventName of WEBHOOK_EVENT_NAMES) {
    domainEvents.on(eventName, (event) => dispatch(event.name, event.payload, event.occurredAt));
  }
}
