import { PrismaClient } from '@prisma/client';

declare global {
  var __amplifyworldPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch (error) {
    // A throw here happens at module-init/cold-start time, before any
    // request handler runs — on some platforms that produces a bare 503
    // with no application-level log line at all. Logging it explicitly
    // ensures a failure to load the query engine (e.g. a missing binary in
    // a deployed bundle) is at least visible instead of silent.
    console.error('[@amplifyworld/database] Failed to instantiate PrismaClient:', error);
    throw error;
  }
}

/**
 * Singleton Prisma client. Reused across hot-reloads in dev so we don't
 * exhaust the Postgres connection pool.
 */
export const prisma = globalThis.__amplifyworldPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__amplifyworldPrisma = prisma;
}

export * from '@prisma/client';
