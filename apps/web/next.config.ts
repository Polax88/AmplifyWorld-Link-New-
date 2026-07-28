import path from 'node:path';
import type { NextConfig } from 'next';

// Loaded eagerly so a missing/invalid env var fails the build immediately
// instead of surfacing as a confusing runtime error later.
import './src/env';

const monorepoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@amplifyworld/core', '@amplifyworld/database', '@amplifyworld/ui'],
  typedRoutes: true,
  // Pins Next.js's file tracer to the actual pnpm workspace root (this is a
  // monorepo — without this, tracing can misjudge the project boundary and
  // over/under-include files across package directories).
  outputFileTracingRoot: monorepoRoot,
  // @amplifyworld/database (which imports @prisma/client) is transpiled
  // above — without this, webpack tries to bundle @prisma/client's
  // generated code straight into the app bundle too. Prisma's client loads
  // its native query engine via a `__dirname`-relative path computed at
  // runtime; once that code is relocated into a webpack chunk, the
  // computed path no longer points at the real .prisma/client directory,
  // and neither the engine binary NOR any of .prisma/client shows up in
  // the file tracer's output at all (confirmed empirically: zero
  // `.prisma/client` references in .next's trace files without this).
  // This keeps @prisma/client a real, unbundled `require()` resolved by
  // Node at runtime, which Next.js's tracer has first-class support for.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
