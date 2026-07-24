import type { PrismaClient } from '../generated/client';
import { demoPrisma } from './demo-client';

/**
 * DEMO MODE: this app is currently running without a live database.
 *
 * `prisma` is backed by an in-memory store (see `demo-client.ts`) that
 * implements the subset of the Prisma Client API the app uses, seeded with a
 * realistic demo artist page. This keeps the app fully functional and
 * deployable without a Postgres connection or migrations.
 *
 * To restore the real database, swap this back to:
 *   export const prisma = globalThis.__amplifyworldPrisma ?? new PrismaClient();
 * and re-enable `prisma migrate deploy` in `apps/web/vercel.json`.
 */
export const prisma = demoPrisma as unknown as PrismaClient;

export { DEMO_USER_ID, DEMO_PAGE_ID } from './demo-client';

// Re-export Prisma's generated types (Prisma namespace, model types, enums)
// so type-only imports across the app keep working.
export * from '../generated/client';
