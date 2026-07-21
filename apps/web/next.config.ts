import type { NextConfig } from 'next';

// Loaded eagerly so a missing/invalid env var fails the build immediately
// instead of surfacing as a confusing runtime error later.
import './src/env';

const nextConfig: NextConfig = {
  transpilePackages: ['@amplifyworld/core', '@amplifyworld/database', '@amplifyworld/ui'],
  typedRoutes: true,
};

export default nextConfig;
