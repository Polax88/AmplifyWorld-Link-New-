import path from 'node:path';
import type { NextConfig } from 'next';

// Loaded eagerly so a missing/invalid env var fails the build immediately
// instead of surfacing as a confusing runtime error later.
import './src/env';

const monorepoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@amplifyworld/core', '@amplifyworld/database', '@amplifyworld/ui'],
  typedRoutes: true,
  // Prisma's query engine binary is loaded via a dynamically-computed path
  // at runtime, not a static import — Vercel's file tracer (@vercel/nft)
  // only follows static require/import calls, so in this pnpm-workspace
  // monorepo (Prisma's generated client lives in packages/database, outside
  // this app's own directory) it silently drops the engine binary from the
  // deployed function unless explicitly told to include it. Without this,
  // every Prisma call in production throws
  // PrismaClientInitializationError: Query Engine not found.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    '/**/*': ['../../packages/database/generated/client/**/*'],
  },
};

export default nextConfig;
