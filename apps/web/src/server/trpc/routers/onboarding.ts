import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@amplifyworld/database';
import { blockRegistry } from '@amplifyworld/core';
import { router, protectedProcedure } from '../trpc';
import type { Context } from '../context';
import { aiAssistant } from '../../services/ai-assistant';
import { profileImportSource } from '../../services/profile-import';
import { analytics } from '../../services/analytics';

/**
 * The onboarding wizard's server side: `start` creates a real Page
 * immediately (so every funnel step has a real pageId to attach analytics
 * to, and the draft survives a refresh), `draft` calls AI + Spotify without
 * persisting blocks, and `commit` writes everything in one transaction.
 * Replaces the bare `page.create` used by the blank-canvas modal — that
 * modal still exists as the "skip, start blank" escape hatch.
 */

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base.length >= 3 ? base : `${base || 'artist'}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Derives a URL handle from a stage name so the wizard never asks the artist to think about a slug up front. */
async function generateUniqueHandle(ctx: Context, stageName: string): Promise<string> {
  const slug = slugify(stageName);
  let candidate = slug;
  for (let attempt = 1; attempt <= 50; attempt++) {
    const existing = await ctx.prisma.page.findUnique({ where: { handle: candidate } });
    if (!existing) return candidate;
    candidate = `${slug}-${attempt}`;
  }
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}

const socialHandleSchema = z.object({ platform: z.string(), handle: z.string().min(1) });
const suggestedBlockSchema = z.object({ type: z.string(), config: z.unknown() });

export const onboardingRouter = router({
  start: protectedProcedure
    .input(z.object({ stageName: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const handle = await generateUniqueHandle(ctx, input.stageName);
      const page = await ctx.prisma.page.create({
        data: { handle, title: input.stageName, ownerId: ctx.session.user.id },
      });

      await analytics.track({ type: 'CUSTOM', pageId: page.id, metadata: { step: 'wizard_started' } });

      return page;
    }),

  searchSpotifyArtist: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => profileImportSource.searchArtists(input.query)),

  draft: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        stageName: z.string().min(1).max(120),
        genre: z.string().max(60).optional(),
        spotifyArtistId: z.string().optional(),
        socialHandles: z.array(socialHandleSchema).max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnership(ctx, input.pageId);

      // Never let a Spotify failure block the draft — profile just stays undefined.
      const profile = input.spotifyArtistId
        ? await profileImportSource.getArtist(input.spotifyArtistId).catch(() => undefined)
        : undefined;

      const result = await aiAssistant.draftPageCopy({
        stageName: input.stageName,
        genre: input.genre,
        profile: profile
          ? {
              name: profile.name,
              imageUrl: profile.imageUrl,
              genres: profile.genres,
              externalUrl: profile.externalUrl,
            }
          : undefined,
        socialHandles: input.socialHandles,
      });

      await analytics.track({ type: 'CUSTOM', pageId: input.pageId, metadata: { step: 'wizard_drafted' } });

      return { bio: result.bio, avatarUrl: profile?.imageUrl, suggestedBlocks: result.suggestedBlocks };
    }),

  commit: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
        blocks: z.array(suggestedBlockSchema).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnership(ctx, input.pageId);

      // Validate every block against its registered schema up front so the
      // whole commit fails clearly rather than partially writing bad data.
      const validatedBlocks = input.blocks.map((block) => ({
        type: block.type,
        config: blockRegistry.parseConfig(block.type, block.config) as Prisma.InputJsonValue,
      }));

      await ctx.prisma.$transaction([
        ctx.prisma.page.update({
          where: { id: input.pageId },
          data: {
            ...(input.bio ? { bio: input.bio } : {}),
            ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
          },
        }),
        ...validatedBlocks.map((block, position) =>
          ctx.prisma.block.create({
            data: { pageId: input.pageId, type: block.type, config: block.config, position },
          }),
        ),
      ]);

      await analytics.track({ type: 'CUSTOM', pageId: input.pageId, metadata: { step: 'wizard_committed' } });

      return { success: true, pageId: input.pageId };
    }),
});
