import { router } from '../trpc';
import { pageRouter } from './page';
import { blockRouter } from './block';
import { analyticsRouter } from './analytics';
import { featureFlagRouter } from './feature-flag';
import { onboardingRouter } from './onboarding';
import { momentumRouter } from './momentum';
import { viberateRouter } from './viberate';
import { apiKeyRouter } from './api-key';
import { fanRouter } from './fan';
import { ampsRouter } from './amps';
import { discoverRouter } from './discover';
import { predictionsRouter } from './predictions';

/**
 * Root router. Add a new domain (e.g. `integration`) by creating
 * `routers/<domain>.ts` following the pattern in `page.ts`/`block.ts` and
 * mounting it here — the client's type-safe API surface updates
 * automatically, no codegen step required.
 */
export const appRouter = router({
  page: pageRouter,
  block: blockRouter,
  analytics: analyticsRouter,
  featureFlag: featureFlagRouter,
  onboarding: onboardingRouter,
  momentum: momentumRouter,
  viberate: viberateRouter,
  apiKey: apiKeyRouter,
  fan: fanRouter,
  amps: ampsRouter,
  discover: discoverRouter,
  predictions: predictionsRouter,
});

export type AppRouter = typeof appRouter;
