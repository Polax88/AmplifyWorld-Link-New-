'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ticket, Plus } from 'lucide-react';
import { Card, Button, Modal } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';
import { CreatePassForm } from './CreatePassForm';

/** Hub summary of a page's demo passes — full detail lives at `/dashboard/[pageId]/passes`. */
export function PassesCard({ pageId }: { pageId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const utils = trpc.useUtils();
  const passes = trpc.pass.listForPage.useQuery({ pageId });

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          <Ticket className="size-3.5" />
          Passes
        </span>
        <div className="flex items-center gap-3">
          {passes.data && passes.data.length > 0 ? (
            <Link
              href={`/dashboard/${pageId}/passes` as never}
              className="text-xs font-medium text-brand-400 hover:text-brand-300"
            >
              View all
            </Link>
          ) : null}
          <Button variant="outline" size="sm" icon={<Plus className="size-3.5" />} onClick={() => setCreateOpen(true)}>
            Create pass
          </Button>
        </div>
      </div>

      {passes.data && passes.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {passes.data.slice(0, 3).map((pass) => (
            <Link
              key={pass.id}
              href={`/dashboard/${pageId}/passes/${pass.id}` as never}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm transition-colors hover:border-white/20"
            >
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: pass.accentColor }} />
                {pass.name}
              </span>
              <span className="text-xs text-white/40">
                {pass.checkedInCount}/{pass.holderCount} checked in
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/50">No passes yet — create one to give fans a shareable branded pass.</p>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create a pass">
        <CreatePassForm
          pageId={pageId}
          onCreated={() => {
            utils.pass.listForPage.invalidate({ pageId });
            setCreateOpen(false);
          }}
        />
      </Modal>
    </Card>
  );
}
