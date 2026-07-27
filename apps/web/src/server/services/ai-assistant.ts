import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  blockRegistry,
  templateRegistry,
  type AiAssistant,
  type DraftPageCopyInput,
  type DraftPageCopyResult,
} from '@amplifyworld/core';
import { env } from '../../env';

const MODEL = 'claude-sonnet-5';

const draftResultSchema = z.object({
  bio: z.string().min(1).max(280),
  suggestedBlocks: z.array(z.object({ type: z.string(), config: z.unknown() })).max(8),
});

function buildPrompt(input: DraftPageCopyInput): string {
  const facts = [
    `Stage name: ${input.stageName}`,
    input.genre ? `Genre: ${input.genre}` : null,
    input.profile?.genres?.length ? `Known genres: ${input.profile.genres.join(', ')}` : null,
    input.socialHandles?.length
      ? `Social handles: ${input.socialHandles.map((h) => `${h.platform}:@${h.handle}`).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are helping an independent musician set up their AmplifyWorld Link page — a link-in-bio page for artists.

${facts}

Write a short, confident bio in their voice (max 2 sentences, under 280 characters) — no generic filler, no emoji spam.

Then suggest 3-5 blocks for their page, each one of these types: "link", "social", "embed", "tip-jar". Reuse any social handles given above as "social" blocks with a plausible profile URL. Always include exactly one "tip-jar" block with label "Support this artist" and checkoutUrl "https://".

Respond with ONLY minified JSON in this exact shape, no markdown fences, no commentary:
{"bio": string, "suggestedBlocks": [{"type": string, "config": object}]}`;
}

/** Claude-backed implementation. Prompt construction and the model call live here, not in @amplifyworld/core. */
export class ClaudeAiAssistant implements AiAssistant {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async draftPageCopy(input: DraftPageCopyInput): Promise<DraftPageCopyResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const parsed = draftResultSchema.parse(JSON.parse(text));

    // Drop any block the model hallucinated with an unregistered type or
    // invalid config, rather than failing the whole draft over one bad block.
    const suggestedBlocks = parsed.suggestedBlocks.flatMap((block) => {
      if (!blockRegistry.get(block.type)) return [];
      try {
        return [{ type: block.type, config: blockRegistry.parseConfig(block.type, block.config) }];
      } catch {
        return [];
      }
    });

    return { bio: parsed.bio, suggestedBlocks };
  }
}

const PLATFORM_URL_TEMPLATES: Record<string, (handle: string) => string> = {
  instagram: (handle) => `https://instagram.com/${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  spotify: (handle) => `https://open.spotify.com/artist/${handle}`,
  apple_music: (handle) => `https://music.apple.com/artist/${handle}`,
  soundcloud: (handle) => `https://soundcloud.com/${handle}`,
  deezer: (handle) => `https://deezer.com/artist/${handle}`,
  facebook: (handle) => `https://facebook.com/${handle}`,
  x: (handle) => `https://x.com/${handle}`,
  discord: (handle) => `https://discord.gg/${handle}`,
  other: (handle) => `https://${handle}`,
};

/**
 * No-network fallback used when Claude isn't configured, or when a real call
 * fails — the wizard always produces a usable draft. Deterministic, no I/O.
 */
export const templateOnlyAiAssistant: AiAssistant = {
  async draftPageCopy(input) {
    const template = templateRegistry.require('musician-starter');
    const bio = input.genre
      ? `${input.stageName} — ${input.genre} artist. New music and updates, always here first.`
      : `${input.stageName} — new music and updates, always here first.`;

    // `social` seeds are slots: only emit one when the artist actually gave
    // a handle for that platform — an empty handle fails that block's own
    // validation, and a fake placeholder handle would be worse (a live page
    // with a made-up profile link).
    const suggestedBlocks = template.blocks.flatMap((seed) => {
      if (seed.type === 'social') {
        const platform = (seed.config as { platform?: string }).platform;
        const match = input.socialHandles?.find((h) => h.platform === platform);
        if (!match || !platform) return [];
        return [
          {
            type: seed.type,
            config: {
              ...(seed.config as object),
              handle: match.handle,
              url: (PLATFORM_URL_TEMPLATES[platform] ?? PLATFORM_URL_TEMPLATES.other!)(match.handle),
            },
          },
        ];
      }
      return [{ type: seed.type, config: seed.config }];
    });

    return { bio, suggestedBlocks };
  },
};

const realAssistant = env.ANTHROPIC_API_KEY ? new ClaudeAiAssistant(env.ANTHROPIC_API_KEY) : null;

/**
 * The assistant used everywhere in the app. Falls back to the deterministic
 * template-only assistant both when no API key is configured AND when a
 * real call fails at runtime — AI assistance is additive, never blocking.
 */
export const aiAssistant: AiAssistant = {
  async draftPageCopy(input) {
    if (!realAssistant) return templateOnlyAiAssistant.draftPageCopy(input);
    try {
      return await realAssistant.draftPageCopy(input);
    } catch (error) {
      console.error('AI draft failed, falling back to template-only draft:', error);
      return templateOnlyAiAssistant.draftPageCopy(input);
    }
  },
};
