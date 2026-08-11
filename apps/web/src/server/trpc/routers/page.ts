import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@amplifyworld/database';
import {
  domainEvents,
  blockRegistry,
  templateRegistry,
  pageThemeSchema,
  getThemePreset,
  isProUser,
  FREE_PLAN_PUBLISHED_PAGE_LIMIT,
} from '@amplifyworld/core';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import type { Context } from '../context';
import { isDemoMode } from '../../../env';
import { regenerateDemoData } from '../../services/demo/generate-demo-artist';
import { generateBioSuggestions } from '../../services/bio-suggestions';

export const pageRouter = router({
  listMine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.page.findMany({
      where: { ownerId: ctx.session.user.id },
      orderBy: { updatedAt: 'desc' },
      // Cheap total-engagement count for the list view; the editor's
      // header shows the precise view/click breakdown (analytics.summaryForPage).
      include: { _count: { select: { analyticsEvents: true } } },
    }),
  ),

  /** The 4 free-tier page templates (Minimal Links, Release Drop, Tour Dates, Merch Drop) — used by the page-template picker. */
  listAvailableTemplates: publicProcedure.query(() =>
    templateRegistry
      .list()
      .filter((template) => template.isPageTemplate)
      .map((template) => ({
        key: template.key,
        displayName: template.displayName,
        description: template.description,
      })),
  ),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const page = await ctx.prisma.page.findUnique({
      where: { id: input.id },
      include: { blocks: { orderBy: { position: 'asc' } } },
    });
    if (!page || page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    return page;
  }),

  getByHandle: publicProcedure.input(z.object({ handle: z.string() })).query(async ({ ctx, input }) => {
    const page = await ctx.prisma.page.findUnique({
      where: { handle: input.handle },
      include: { blocks: { where: { isEnabled: true }, orderBy: { position: 'asc' } } },
    });
    if (!page || page.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    return page;
  }),

  create: protectedProcedure
    .input(
      z.object({
        handle: z
          .string()
          .min(3)
          .max(48)
          .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only.'),
        title: z.string().min(1).max(120),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.page.create({
        data: { ...input, ownerId: ctx.session.user.id },
      }),
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(120).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.union([z.string().url(), z.literal('')]).optional(),
        theme: pageThemeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, theme, avatarUrl, ...data } = input;
      const page = await assertOwnership(ctx, id);

      // A premium theme can only be applied once the owner has spent AMPS
      // to unlock it (see amps.unlockTheme) — enforced here too, not just
      // by disabling the option client-side, since this is the one place
      // that actually persists the choice. The compact layout is likewise a
      // Pro perk — free-tier customization stops at title/avatar/bio/accent
      // color/block order (see `isProUser`); layout is "deeper
      // customization", same bucket as the premium theme packs.
      if (theme) {
        const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: page.ownerId } });
        const preset = getThemePreset(theme.themeKey);
        const pro = isProUser(user.unlockedThemes);
        if (preset.isPremium && !user.unlockedThemes.includes(preset.key)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: `"${preset.displayName}" hasn't been unlocked yet.` });
        }
        if (theme.layout === 'compact' && !pro) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'The compact layout is a Pro perk — unlock by spending $AMPS.' });
        }
      }

      return ctx.prisma.page.update({
        where: { id },
        data: {
          ...data,
          ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
          ...(theme ? { theme: theme as Prisma.InputJsonValue } : {}),
        },
      });
    }),

  /**
   * Mocked "Write with AI" bio suggestions — deterministic, no LLM call (see
   * bio-suggestions.ts). Purely a generator; the artist still picks one and
   * hits Save (the `update` mutation above) to persist it.
   */
  suggestBio: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    const page = await assertOwnership(ctx, input.pageId);
    return { suggestions: generateBioSuggestions({ stageName: page.title }) };
  }),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) }))
    .mutation(async ({ ctx, input }) => {
      const page = await assertOwnership(ctx, input.id);

      // Free plan: 1 published page. Publishing a 2nd (or Nth) page requires
      // Pro — the existing $AMPS mechanic (spending AMPS to unlock any
      // premium theme). Only checked when actually *activating* a publish,
      // never when unpublishing/archiving.
      if (input.status === 'PUBLISHED' && page.status !== 'PUBLISHED') {
        const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: page.ownerId } });
        if (!isProUser(user.unlockedThemes)) {
          const otherPublishedCount = await ctx.prisma.page.count({
            where: { ownerId: page.ownerId, status: 'PUBLISHED', id: { not: page.id } },
          });
          if (otherPublishedCount >= FREE_PLAN_PUBLISHED_PAGE_LIMIT) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `The free plan allows ${FREE_PLAN_PUBLISHED_PAGE_LIMIT} published page. Unlock Pro (spend $AMPS) to publish more.`,
            });
          }
        }
      }

      const updated = await ctx.prisma.page.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      const occurredAt = new Date().toISOString();
      if (input.status === 'PUBLISHED' && page.status !== 'PUBLISHED') {
        await domainEvents.publish('page.published', { pageId: page.id, handle: page.handle }, occurredAt);
      } else if (input.status !== 'PUBLISHED' && page.status === 'PUBLISHED') {
        await domainEvents.publish('page.unpublished', { pageId: page.id, handle: page.handle }, occurredAt);
      }

      return updated;
    }),

  /**
   * Applies a page template's "sensible default block order/emphasis" for
   * its use case. On a freshly-created (empty) page, seeds its blocks
   * outright — the quick alternative to the AI onboarding wizard. On a page
   * that already has blocks, switching templates never creates or deletes
   * anything (free-tier customization is limited to reordering *existing*
   * blocks) — it only reorders them so blocks matching the template's
   * leading types (e.g. Tour Dates' ticket links) move to the front, in the
   * template's own order; anything the template doesn't mention keeps its
   * relative order at the end. Always records `templateKey` so the picker
   * can show which template is active.
   */
  applyTemplate: protectedProcedure
    .input(z.object({ pageId: z.string(), templateKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnership(ctx, input.pageId);
      const template = templateRegistry.require(input.templateKey);

      const existingBlocks = await ctx.prisma.block.findMany({
        where: { pageId: input.pageId },
        orderBy: { position: 'asc' },
      });

      if (existingBlocks.length === 0) {
        const validatedBlocks = template.blocks.flatMap((seed) => {
          try {
            return [{ type: seed.type, config: blockRegistry.parseConfig(seed.type, seed.config) }];
          } catch {
            return [];
          }
        });

        await ctx.prisma.$transaction([
          ...validatedBlocks.map((block, position) =>
            ctx.prisma.block.create({
              data: {
                pageId: input.pageId,
                type: block.type,
                config: block.config as Prisma.InputJsonValue,
                position,
              },
            }),
          ),
          ctx.prisma.page.update({ where: { id: input.pageId }, data: { templateKey: template.key } }),
        ]);

        return { success: true };
      }

      const typeRank = new Map(
        Array.from(new Set(template.blocks.map((seed) => seed.type))).map((type, index) => [type, index]),
      );
      const reordered = existingBlocks
        .map((block, originalIndex) => ({ block, originalIndex, rank: typeRank.get(block.type) ?? Infinity }))
        .sort((a, b) => a.rank - b.rank || a.originalIndex - b.originalIndex);

      await ctx.prisma.$transaction([
        ...reordered.map(({ block }, position) =>
          ctx.prisma.block.update({ where: { id: block.id }, data: { position } }),
        ),
        ctx.prisma.page.update({ where: { id: input.pageId }, data: { templateKey: template.key } }),
      ]);

      return { success: true };
    }),

  /**
   * Demo-only: wipes and rebuilds this page's synthetic AMI/Viberate history
   * and fan data (see `generate-demo-artist.ts`'s `regenerateDemoData`) so a
   * demo that's sat around for a while can refresh in place. Gated on
   * `DEMO_MODE` in addition to ownership — never callable against a real
   * deployment's data, even by the page's own owner.
   */
  regenerateDemoData: protectedProcedure.input(z.object({ pageId: z.string() })).mutation(async ({ ctx, input }) => {
    if (!isDemoMode) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode is not enabled.' });
    }
    await assertOwnership(ctx, input.pageId);
    await regenerateDemoData(input.pageId);
    return { success: true };
  }),
});

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
