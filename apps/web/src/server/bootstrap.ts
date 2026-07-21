import { blockRegistry, registerCoreBlocks } from '@amplifyworld/core';
import { registerWebhookDispatcher } from './services/webhook-dispatcher';

let bootstrapped = false;

/**
 * Wires up everything that needs to happen once per process: registering
 * block types and subscribing the webhook dispatcher to domain events.
 * Idempotent so it's safe to call from multiple entry points (route
 * handlers, server components) in dev's hot-reload environment.
 */
export function bootstrap(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  registerCoreBlocks(blockRegistry);
  registerWebhookDispatcher();
}

bootstrap();
