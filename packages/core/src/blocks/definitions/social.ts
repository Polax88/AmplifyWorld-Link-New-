import { z } from 'zod';
import { defineBlock } from '../types';

const configSchema = z.object({
  platform: z.enum([
    'instagram',
    'tiktok',
    'youtube',
    'spotify',
    'x',
    'discord',
    'other',
  ]),
  handle: z.string().min(1),
  url: z.string().url(),
});

export type SocialBlockConfig = z.infer<typeof configSchema>;

export const socialBlock = defineBlock<SocialBlockConfig>({
  type: 'social',
  displayName: 'Social profile',
  description: 'A branded icon linking out to a social or streaming profile.',
  configSchema,
  defaultConfig: { platform: 'instagram', handle: '', url: 'https://' },
});
