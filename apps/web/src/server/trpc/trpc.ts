import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/** Base router/procedure builders. New routers should be built from these, not `initTRPC` directly. */
export const router = t.router;
export const publicProcedure = t.procedure;

/** Requires a signed-in user. `ctx.session` is narrowed to non-null after this. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

/** Requires a signed-in ADMIN. Extend this pattern for other role checks as they're needed. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});
