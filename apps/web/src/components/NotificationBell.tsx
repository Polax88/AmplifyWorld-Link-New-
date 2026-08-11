'use client';

import { useState } from 'react';
import { Bell, TrendingUp } from 'lucide-react';
import { IconButton, Modal, Card, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/** Artist-facing momentum alerts (e.g. "entered the Top 100 today") — admin's own leaderboard view is unaffected. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const alerts = trpc.momentum.myAlerts.useQuery();
  const markAllSeen = trpc.momentum.markAllAlertsSeen.useMutation({
    onSuccess: () => utils.momentum.myAlerts.invalidate(),
  });

  const unseenCount = alerts.data?.filter((a) => !a.seen).length ?? 0;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unseenCount > 0) {
      markAllSeen.mutate();
    }
  }

  return (
    <>
      <IconButton aria-label="Notifications" variant="secondary" onClick={() => handleOpenChange(true)}>
        <span className="relative">
          <Bell className="size-4" />
          {unseenCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-semibold text-white">
              {unseenCount > 9 ? '9+' : unseenCount}
            </span>
          ) : null}
        </span>
      </IconButton>
      <Modal open={open} onOpenChange={handleOpenChange} title="AMI alerts">
        <div className="flex flex-col gap-2">
          {alerts.data?.length ? (
            alerts.data.map((alert) => (
              <Card key={alert.id} className="flex flex-row items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
                  <TrendingUp className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{alert.pageTitle}</span> {alert.message.toLowerCase()}
                  </p>
                  <p className="text-xs text-ink-faint">{new Date(alert.date).toLocaleDateString()}</p>
                </div>
                {!alert.seen ? <Badge tone="brand">New</Badge> : null}
              </Card>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">No alerts yet.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
