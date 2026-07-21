import { z } from 'zod';
import { defineBlock } from '../types';

const configSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url(),
  icon: z.string().optional(),
});

export type LinkBlockConfig = z.infer<typeof configSchema>;

export const linkBlock = defineBlock<LinkBlockConfig>({
  type: 'link',
  displayName: 'Link',
  description: 'A single call-to-action link — streaming, merch, tickets, tour dates.',
  configSchema,
  defaultConfig: { label: 'New link', url: 'https://' },
});
