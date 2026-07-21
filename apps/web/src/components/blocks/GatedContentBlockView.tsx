import { Lock } from 'lucide-react';
import type { GatedContentBlockConfig } from '@amplifyworld/core';

/**
 * Renders the locked state only. Eligibility resolution (does this fan's
 * connected wallet/stake unlock this?) is intentionally not implemented
 * here — it belongs to whichever integration owns `integrationConnectionId`
 * and is out of scope for this app. Wire it up by having that service
 * expose a check the dashboard/page can call server-side.
 */
export function GatedContentBlockView({ config }: { config: GatedContentBlockConfig }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-5 text-center">
      <span className="flex size-9 items-center justify-center rounded-full bg-white/8 text-white/60">
        <Lock className="size-4" />
      </span>
      <p className="text-sm font-medium text-white">{config.label}</p>
      <p className="text-xs text-white/50">{config.lockedMessage}</p>
    </div>
  );
}
