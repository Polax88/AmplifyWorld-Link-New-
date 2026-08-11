'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Check, Copy, Eye, EyeOff, PartyPopper, Smartphone } from 'lucide-react';
import { Button, Card, Modal, QrCode, Textarea } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { blockTypeIcon } from '../../../../components/blocks/blockTypeIcon';
import { PagePreview } from '../../../../components/PagePreview';

/**
 * The wizard's second (and last) screen: the page `GenerateStep` already
 * created, drafted, and committed, shown live — review/tweak in place
 * rather than a separate pre-commit draft, then publish. Reuses the exact
 * same mutations the full editor uses (`page.update`, `block.setEnabled`,
 * `page.setStatus`), so nothing here is a special "wizard-only" code path.
 */
export function ReadyStep({ pageId, handle }: { pageId: string; handle: string }) {
  const [copied, setCopied] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [bioDraft, setBioDraft] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const invalidate = () => utils.page.getById.invalidate({ id: pageId });

  const pageQuery = trpc.page.getById.useQuery({ id: pageId });
  const updatePage = trpc.page.update.useMutation({ onSuccess: invalidate });
  const setEnabled = trpc.block.setEnabled.useMutation({ onSuccess: invalidate });
  const setStatus = trpc.page.setStatus.useMutation({ onSuccess: invalidate });

  const page = pageQuery.data;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${handle}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveBioIfChanged() {
    if (bioDraft !== null && bioDraft !== page?.bio) {
      updatePage.mutate({ id: pageId, bio: bioDraft });
    }
  }

  if (pageQuery.isLoading || !page) {
    return <p className="text-center text-ink-muted">Loading your page…</p>;
  }

  const bio = bioDraft ?? page.bio ?? '';
  const published = page.status === 'PUBLISHED';

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <PartyPopper className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-ink">Your page is ready</h1>
              <p className="mt-0.5 text-sm text-ink-muted">Review below, or publish as-is.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Smartphone className="size-3.5" />}
            className="lg:hidden"
            onClick={() => setMobilePreviewOpen(true)}
          >
            Preview
          </Button>
        </div>

        <Textarea
          label="Bio"
          maxLength={500}
          rows={3}
          value={bio}
          onChange={(event) => setBioDraft(event.target.value)}
          onBlur={saveBioIfChanged}
        />

        {page.viberateArtistId ? (
          <Card className="flex items-center gap-2.5">
            <Activity className="size-4 shrink-0 text-brand-400" />
            <span className="text-sm text-ink-muted">Connected to Viberate for cross-platform momentum data.</span>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Your smart links</span>
          {page.blocks.map((block) => {
            const Icon = blockTypeIcon[block.type];
            return (
              <Card key={block.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {Icon ? (
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-ink-muted">
                      <Icon className="size-4" />
                    </span>
                  ) : null}
                  <span className="text-sm font-medium capitalize text-ink">{block.type.replace('-', ' ')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled.mutate({ id: block.id, isEnabled: !block.isEnabled })}
                  className="text-ink-faint hover:text-ink"
                  aria-label={block.isEnabled ? 'Hide block' : 'Show block'}
                >
                  {block.isEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </Card>
            );
          })}
        </div>

        <Card className="flex items-center justify-between gap-3">
          <span className="truncate text-sm text-ink">{url}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </Card>

        <div className="flex gap-3">
          <Link href={`/dashboard/${pageId}` as never} className="flex-1">
            <Button variant="outline" className="w-full">
              Open full editor
            </Button>
          </Link>
          <Button
            className="flex-1"
            loading={setStatus.isPending}
            disabled={published}
            onClick={() => setStatus.mutate({ id: pageId, status: 'PUBLISHED' })}
          >
            {published ? 'Published' : 'Publish now'}
          </Button>
        </div>
        {setStatus.error ? <p className="text-xs text-red-400">{setStatus.error.message}</p> : null}
      </div>

      <div className="hidden flex-col items-center gap-4 justify-self-center lg:sticky lg:top-24 lg:flex">
        <PagePreview title={page.title} bio={bio} avatarUrl={page.avatarUrl} blocks={page.blocks} handle={page.handle} />
        <QrCode value={url} size={120} downloadable downloadFileName={`${handle}-qr.png`} />
      </div>

      <Modal
        open={mobilePreviewOpen}
        onOpenChange={setMobilePreviewOpen}
        title="Live preview"
        className="flex w-auto max-w-none justify-center border-none bg-transparent p-0 shadow-none"
      >
        <PagePreview title={page.title} bio={bio} avatarUrl={page.avatarUrl} blocks={page.blocks} handle={page.handle} />
      </Modal>
    </div>
  );
}
