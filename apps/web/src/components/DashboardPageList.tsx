'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, Activity } from 'lucide-react';
import { Button, Card, Badge, Input, Modal, Skeleton } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';
import { useDashboardContext } from './DashboardContext';

const statusTone = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
} as const;

/** The full "your pages" list — shown when an artist has more than one page, or explicitly asks for it (`/dashboard?view=all`). Single-page artists land straight in their hub instead (see `dashboard/page.tsx`). */
export function DashboardPageList() {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const { aiWizardEnabled } = useDashboardContext();

  const utils = trpc.useUtils();
  const pages = trpc.page.listMine.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your pages</h1>
          <p className="mt-1 text-sm text-white/50">Manage the link pages you share with fans.</p>
        </div>
        <Button
          icon={<Plus className="size-4" />}
          onClick={() => (aiWizardEnabled ? router.push('/dashboard/new') : setCreateOpen(true))}
        >
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
                <div className="flex items-center gap-3">
                  {page._count.analyticsEvents > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Activity className="size-3" />
                      {page._count.analyticsEvents}
                    </span>
                  ) : null}
                  <Badge tone={statusTone[page.status]}>{page.status}</Badge>
                </div>
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

  // The 4 free-tier page templates — Minimal Links, Release Drop, Tour
  // Dates, Merch Drop. Defaults to the first (Minimal Links); artists can
  // switch anytime from the page editor's own template picker.
  const templates = trpc.page.listAvailableTemplates.useQuery();
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const selectedTemplateKey = templateKey ?? templates.data?.[0]?.key;

  const applyTemplate = trpc.page.applyTemplate.useMutation();
  const createPage = trpc.page.create.useMutation({
    onSuccess: async (page) => {
      if (selectedTemplateKey) {
        await applyTemplate.mutateAsync({ pageId: page.id, templateKey: selectedTemplateKey });
      }
      onCreated();
      onOpenChange(false);
      setHandle('');
      setTitle('');
      setTemplateKey(null);
    },
  });

  const busy = createPage.isPending || applyTemplate.isPending;

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
        {templates.data && templates.data.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/70">Starting template</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {templates.data.map((template) => (
                <label
                  key={template.key}
                  className={
                    selectedTemplateKey === template.key
                      ? 'flex flex-col gap-0.5 rounded-xl border border-brand-400/50 bg-brand-500/10 p-2.5 text-left'
                      : 'flex flex-col gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left'
                  }
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="templateKey"
                      checked={selectedTemplateKey === template.key}
                      onChange={() => setTemplateKey(template.key)}
                      className="size-3.5 accent-brand-500"
                    />
                    <span className="text-sm text-white">{template.displayName}</span>
                  </span>
                  <span className="pl-6 text-xs text-white/45">{template.description}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {createPage.error ? (
          <p className="text-xs text-red-400">{createPage.error.message}</p>
        ) : null}
        <Button type="submit" loading={busy} className="w-full">
          Create page
        </Button>
      </form>
    </Modal>
  );
}
