import { z } from 'zod';
import { defineBlock } from '../types';
import { CONVERSION_EVENT_TYPES } from '../../analytics/conversion-types';

const configSchema = z.object({
  platform: z.enum([
    'instagram',
    'tiktok',
    'youtube',
    'spotify',
    'apple_music',
    'soundcloud',
    'deezer',
    'facebook',
    'x',
    'discord',
    'other',
  ]),
  handle: z.string().min(1),
  url: z.string().url(),
  // Defaults to 'follow' — a social profile link is a follow ask by default;
  // an artist can reclassify it (e.g. a Spotify profile as 'stream') from
  // the block's editor. Same untagged-detection convention as the link
  // block: a stored config with no explicit conversionType is what the
  // tracking-hygiene indicator flags.
  conversionType: z.enum(CONVERSION_EVENT_TYPES).default('follow'),
});

export type SocialBlockConfig = z.infer<typeof configSchema>;

export const socialBlock = defineBlock<SocialBlockConfig>({
  type: 'social',
  displayName: 'Social profile',
  description: 'A branded icon linking out to a social or streaming profile.',
  configSchema,
  // Must satisfy configSchema on its own — this is parsed through
  // `blockRegistry.parseConfig` the moment a block is added, before a user
  // has edited anything.
  defaultConfig: {
    platform: 'instagram',
    handle: 'yourhandle',
    url: 'https://instagram.com/yourhandle',
    conversionType: 'follow',
  },
});
