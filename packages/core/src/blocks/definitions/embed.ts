import { z } from 'zod';
import { defineBlock } from '../types';

const configSchema = z.object({
  provider: z.enum(['spotify', 'youtube', 'soundcloud']),
  embedUrl: z.string().url(),
  title: z.string().optional(),
});

export type EmbedBlockConfig = z.infer<typeof configSchema>;

export const embedBlock = defineBlock<EmbedBlockConfig>({
  type: 'embed',
  displayName: 'Media embed',
  description: 'An inline player for a track, video, or playlist.',
  configSchema,
  defaultConfig: { provider: 'spotify', embedUrl: 'https://' },
});
