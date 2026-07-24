import { z } from 'zod';
import { defineBlock } from '../types';

/**
 * Generic access-gated content block. This block is intentionally dumb: it
 * points at an `IntegrationConnection` (see @amplifyworld/database) by id
 * and defers the actual "is this fan allowed in" check to that external
 * service (e.g. a wallet or staking balance check). This package contains
 * no token-economics or eligibility logic — that lives in, and is owned by,
 * the relevant external service and its own compliance review.
 */
const configSchema = z.object({
  label: z.string().min(1).max(120),
  integrationConnectionId: z.string().min(1),
  unlockedUrl: z.string().url(),
  lockedMessage: z.string().max(280).default('Connect to unlock this content.'),
});

export type GatedContentBlockConfig = z.infer<typeof configSchema>;

export const gatedContentBlock = defineBlock<GatedContentBlockConfig>({
  type: 'gated-content',
  displayName: 'Gated content',
  description:
    'Content unlocked via an external integration (wallet, staking, allowlist). Eligibility is resolved by the connected service, not by this app.',
  configSchema,
  // Must satisfy configSchema on its own — this is parsed through
  // `blockRegistry.parseConfig` the moment a block is added, before a user
  // has edited anything. `integrationConnectionId` is a clear placeholder;
  // there's no real connection to reference by default.
  defaultConfig: {
    label: 'Exclusive content',
    integrationConnectionId: 'not-yet-connected',
    unlockedUrl: 'https://example.com',
    lockedMessage: 'Connect to unlock this content.',
  },
});
