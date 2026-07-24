import { z } from 'zod';
import { defineBlock } from '../types';

const configSchema = z.object({
  label: z.string().min(1).max(120).default('Support this artist'),
  checkoutUrl: z.string().url(), // external payment/checkout link (provider-agnostic)
  suggestedAmounts: z.array(z.number().positive()).max(6).optional(),
});

export type TipJarBlockConfig = z.infer<typeof configSchema>;

export const tipJarBlock = defineBlock<TipJarBlockConfig>({
  type: 'tip-jar',
  displayName: 'Tip jar',
  description: 'A link out to an external checkout for fan support/tips.',
  configSchema,
  // Must satisfy configSchema on its own — this is parsed through
  // `blockRegistry.parseConfig` the moment a block is added, before a user
  // has edited anything.
  defaultConfig: { label: 'Support this artist', checkoutUrl: 'https://example.com/tip' },
});
