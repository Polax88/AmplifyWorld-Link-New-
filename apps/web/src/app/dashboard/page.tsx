'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink } from 'lucide-react';
import { Button, Card, Badge, Input, Modal, Skeleton } from '@amplifyworld/ui';
import { trpc } from '../../lib/trpc/client';

const statusTone = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
} as const;

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const utils = trpc.useUtils();
  const pages = trpc.page.listMine.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your pages</h1>
          <p className="mt-1 text-sm text-white/50">Manage the link pages you share with fans.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          New page
        </Button>
      </div>

      {pages.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pages.data?.map((page) => (
            <Link key={page.id} href={`/dashboard/${page.id}` as never}>
              <Card interactive className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{page.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-white/50">
                    /{page.handle}
                    {page.status === 'PUBLISHED' ? <ExternalLink className="size-3" /> : null}
                  </p>
                </div>
                <Badge tone={statusTone[page.status]}>{page.status}</Badge>
              </Card>
            </Link>
          ))}
          {pages.data?.length === 0 ? (
            <Card className="items-center py-10 text-center text-white/50">
              No pages yet — create your first one to get a shareable link.
            </Card>
          ) : null}
        </div>
      )}

      <CreatePageModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => utils.page.listMine.invalidate()}
      />
    </div>
  );
}

function CreatePageModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [handle, setHandle] = useState('');
  const [title, setTitle] = useState('');

  const createPage = trpc.page.create.useMutation({
    onSuccess: () => {
      onCreated();
      onOpenChange(false);
      setHandle('');
      setTitle('');
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New page" description="Pick a handle for your public link.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          createPage.mutate({ handle, title: title || handle });
        }}
      >
        <Input
          label="Handle"
          placeholder="your-artist-name"
          pattern="[a-z0-9-]+"
          minLength={3}
          maxLength={48}
          required
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          hint="Lowercase letters, numbers, and hyphens only."
        />
        <Input
          label="Display title"
          placeholder="Your artist name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {createPage.error ? (
          <p className="text-xs text-red-400">{createPage.error.message}</p>
        ) : null}
        <Button type="submit" loading={createPage.isPending} className="w-full">
          Create page
        </Button>
      </form>
    </Modal>
  );
}
