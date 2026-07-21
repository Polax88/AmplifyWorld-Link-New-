import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@amplifyworld/database';
import { blockRegistry } from '@amplifyworld/core';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import type { Context } from '../context';

async function assertPageOwnership(
  ctx: Context & { session: NonNullable<Context['session']> },
  pageId: string,
) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}

export const blockRouter = router({
  /** Metadata for every registered block type, used to render an "add block" picker. */
  listAvailableTypes: publicProcedure.query(() =>
    blockRegistry.list().map((definition) => ({
      type: definition.type,
      displayName: definition.displayName,
      description: definition.description,
      defaultConfig: definition.defaultConfig,
    })),
  ),

  create: protectedProcedure
    .input(z.object({ pageId: z.string(), type: z.string(), config: z.unknown().optional() }))
    .mutation(async ({ ctx, input }) => {
      await assertPageOwnership(ctx, input.pageId);
      const definition = blockRegistry.require(input.type);
      const config = blockRegistry.parseConfig(input.type, input.config ?? definition.defaultConfig);

      const lastBlock = await ctx.prisma.block.findFirst({
        where: { pageId: input.pageId },
        orderBy: { position: 'desc' },
      });

      return ctx.prisma.block.create({
        data: {
          pageId: input.pageId,
          type: input.type,
          config: config as Prisma.InputJsonValue,
          position: (lastBlock?.position ?? -1) + 1,
        },
      });
    }),

  updateConfig: protectedProcedure
    .input(z.object({ id: z.string(), config: z.unknown() }))
    .mutation(async ({ ctx, input }) => {
      const block = await ctx.prisma.block.findUnique({ where: { id: input.id } });
      if (!block) throw new TRPCError({ code: 'NOT_FOUND' });
      await assertPageOwnership(ctx, block.pageId);

      const config = blockRegistry.parseConfig(block.type, input.config);
      return ctx.prisma.block.update({
        where: { id: input.id },
        data: { config: config as Prisma.InputJsonValue },
      });
    }),

  setEnabled: protectedProcedure
    .input(z.object({ id: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const block = await ctx.prisma.block.findUnique({ where: { id: input.id } });
      if (!block) throw new TRPCError({ code: 'NOT_FOUND' });
      await assertPageOwnership(ctx, block.pageId);
      return ctx.prisma.block.update({ where: { id: input.id }, data: { isEnabled: input.isEnabled } });
    }),

  reorder: protectedProcedure
    .input(z.object({ pageId: z.string(), orderedBlockIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await assertPageOwnership(ctx, input.pageId);
      await ctx.prisma.$transaction(
        input.orderedBlockIds.map((id, position) =>
          ctx.prisma.block.update({ where: { id }, data: { position } }),
        ),
      );
      return { success: true };
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const block = await ctx.prisma.block.findUnique({ where: { id: input.id } });
    if (!block) throw new TRPCError({ code: 'NOT_FOUND' });
    await assertPageOwnership(ctx, block.pageId);
    await ctx.prisma.block.delete({ where: { id: input.id } });
    return { success: true };
  }),
});
