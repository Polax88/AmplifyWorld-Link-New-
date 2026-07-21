import { PrismaClient } from '../generated/client';

declare global {
  var __amplifyworldPrisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client. Reused across hot-reloads in dev so we don't
 * exhaust the Postgres connection pool.
 */
export const prisma = globalThis.__amplifyworldPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__amplifyworldPrisma = prisma;
}

export * from '../generated/client';
