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
  // above — without this, webpack bundles @prisma/client's generated code
  // straight into the app bundle too, which breaks its runtime engine-path
  // resolution. This keeps @prisma/client a real, unbundled `require()`
  // resolved by Node at runtime instead. For that resolution to actually
  // succeed in the deployed function (not just in local dev, where the full
  // monorepo node_modules tree is present), @prisma/client must also be a
  // *direct* dependency of this app (see apps/web/package.json) — pnpm only
  // symlinks a package into the node_modules of packages that declare it
  // directly, and Next's file tracer/standalone output only preserves
  // symlinks reachable via a package's own node_modules chain.
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
