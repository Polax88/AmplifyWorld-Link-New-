import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@amplifyworld/database';
import { domainEvents, blockRegistry, templateRegistry } from '@amplifyworld/core';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import type { Context } from '../context';
import { env } from '../../../env';
import { regenerateDemoData } from '../../services/demo/generate-demo-artist';

const themeSchema = z.record(z.string(), z.unknown()).default({});

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

  /** Metadata for every registered starter template, used by the "start from template" option. */
  listAvailableTemplates: publicProcedure.query(() =>
    templateRegistry.list().map((template) => ({
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
        avatarUrl: z.string().url().optional(),
        theme: themeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, theme, ...data } = input;
      await assertOwnership(ctx, id);
      return ctx.prisma.page.update({
        where: { id },
        data: { ...data, ...(theme ? { theme: theme as Prisma.InputJsonValue } : {}) },
      });
    }),

  setStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) }))
    .mutation(async ({ ctx, input }) => {
      const page = await assertOwnership(ctx, input.id);
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
   * Seeds a freshly-created (empty) page with a starter template's blocks —
   * the quick alternative to the AI onboarding wizard for the blank-canvas
   * "New page" flow. Slots the template can't fill without artist input
   * (e.g. social handles) are silently skipped rather than shipped invalid;
   * the wizard is the richer path for that.
   */
  applyTemplate: protectedProcedure
    .input(z.object({ pageId: z.string(), templateKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnership(ctx, input.pageId);
      const template = templateRegistry.require(input.templateKey);

      const validatedBlocks = template.blocks.flatMap((seed) => {
        try {
          return [{ type: seed.type, config: blockRegistry.parseConfig(seed.type, seed.config) }];
        } catch {
          return [];
        }
      });

      if (validatedBlocks.length === 0) return { success: true };

      await ctx.prisma.$transaction(
        validatedBlocks.map((block, position) =>
          ctx.prisma.block.create({
            data: {
              pageId: input.pageId,
              type: block.type,
              config: block.config as Prisma.InputJsonValue,
              position,
            },
          }),
        ),
      );

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
    if (!env.DEMO_MODE) {
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
