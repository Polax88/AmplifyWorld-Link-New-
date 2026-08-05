'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Card, IconButton } from '@amplifyworld/ui';

function dismissKey(pageId: string): string {
  return `welcome-dismissed-${pageId}`;
}

/** One-time "welcome" callout on a freshly created hub, dismissed permanently via localStorage — no schema, no server round trip. */
export function HubWelcomeBanner({ pageId }: { pageId: string }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(dismissKey(pageId)) === '1');
  }, [pageId]);

  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(dismissKey(pageId), '1');
    setDismissed(true);
  }

  return (
    <Card className="flex items-start justify-between gap-3 border-brand-400/30 bg-brand-500/[0.06]">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Welcome to your hub</p>
          <p className="mt-0.5 text-xs text-white/60">
            Your AMI score, smart links, and fan data all live here. Predict on Discover to start earning $AMPS, then
            spend it on premium themes and boosts under Upgrade.
          </p>
        </div>
      </div>
      <IconButton aria-label="Dismiss welcome message" variant="secondary" onClick={dismiss}>
        <X className="size-3.5" />
      </IconButton>
    </Card>
  );
}
