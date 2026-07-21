import type { DomainEvent, DomainEventMap, DomainEventName } from './types';

type Handler<TName extends DomainEventName> = (
  event: DomainEvent<TName>,
) => void | Promise<void>;

/**
 * Minimal typed pub/sub bus. In-process only by design — it decouples "code
 * that causes something to happen" (e.g. a tRPC mutation publishing a page)
 * from "code that reacts to it" (analytics, webhook dispatch, future
 * integrations), without pulling in a message queue this app doesn't need
 * yet. If/when cross-process delivery is needed, swap the `publish`
 * implementation for one backed by a queue — subscribers don't change.
 */
export class DomainEventBus {
  private readonly handlers = new Map<DomainEventName, Set<Handler<DomainEventName>>>();

  on<TName extends DomainEventName>(name: TName, handler: Handler<TName>): () => void {
    const set = this.handlers.get(name) ?? new Set();
    set.add(handler as Handler<DomainEventName>);
    this.handlers.set(name, set);
    return () => set.delete(handler as Handler<DomainEventName>);
  }

  async publish<TName extends DomainEventName>(
    name: TName,
    payload: DomainEventMap[TName],
    occurredAt: string,
  ): Promise<void> {
    const event: DomainEvent<TName> = { name, payload, occurredAt };
    const set = this.handlers.get(name);
    if (!set) return;
    await Promise.all(Array.from(set).map((handler) => handler(event)));
  }
}

export const domainEvents = new DomainEventBus();
