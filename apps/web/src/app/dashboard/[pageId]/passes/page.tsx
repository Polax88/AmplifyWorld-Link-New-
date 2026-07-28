'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { IconButton, Button, Card, Modal } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { CreatePassForm } from '../../../../components/CreatePassForm';

export default function PassesPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const [createOpen, setCreateOpen] = useState(false);
  const utils = trpc.useUtils();
  const page = trpc.page.getById.useQuery({ id: pageId });
  const passes = trpc.pass.listForPage.useQuery({ pageId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${pageId}` as never}>
            <IconButton aria-label="Back to hub" variant="secondary">
              <ArrowLeft className="size-4" />
            </IconButton>
          </Link>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Passes</h1>
            <p className="text-sm text-white/50">Shareable demo passes for {page.data?.title ?? 'this page'}.</p>
          </div>
        </div>
        <Button icon={<Plus className="size-3.5" />} onClick={() => setCreateOpen(true)}>
          Create pass
        </Button>
      </div>

      {passes.isLoading ? (
        <Card className="h-32 animate-pulse" />
      ) : !passes.data || passes.data.length === 0 ? (
        <Card className="items-center py-8 text-center text-sm text-white/50">
          No passes yet — create one to give fans a shareable branded pass with a QR code.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {passes.data.map((pass) => (
            <Link key={pass.id} href={`/dashboard/${pageId}/passes/${pass.id}` as never}>
              <Card interactive className="gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: pass.accentColor }} />
                  <span className="font-medium">{pass.name}</span>
                </div>
                {pass.eventName ? <p className="text-xs text-white/50">{pass.eventName}</p> : null}
                <p className="text-xs text-white/40">
                  {pass.checkedInCount}/{pass.holderCount} checked in
                </p>
              </Card>
            </Link>
          ))}
        </div>
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
    </div>
  );
}
