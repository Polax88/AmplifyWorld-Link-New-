import type { GatedContentBlockConfig } from '@amplifyworld/core';
import { Card } from '@amplifyworld/ui';

/**
 * Renders the locked state only. Eligibility resolution (does this fan's
 * connected wallet/stake unlock this?) is intentionally not implemented
 * here — it belongs to whichever integration owns `integrationConnectionId`
 * and is out of scope for this app. Wire it up by having that service
 * expose a check the dashboard/page can call server-side.
 */
export function GatedContentBlockView({ config }: { config: GatedContentBlockConfig }) {
  return (
    <Card className="text-center text-sm text-white/70">
      <p className="mb-1 font-medium text-white">{config.label}</p>
      <p>{config.lockedMessage}</p>
    </Card>
  );
}
