'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, PartyPopper } from 'lucide-react';
import { Button, Card, QrCode } from '@amplifyworld/ui';
import { trpc } from '../../../lib/trpc/client';

export function SuccessStep({ pageId, handle }: { pageId: string; handle: string }) {
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();
  const setStatus = trpc.page.setStatus.useMutation({ onSuccess: () => utils.page.getById.invalidate({ id: pageId }) });

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${handle}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
        <PartyPopper className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Your page is ready</h1>
        <p className="mt-1 text-sm text-white/60">
          It&apos;s saved as a draft — publish it whenever you&apos;re ready to share.
        </p>
      </div>

      <QrCode value={url} size={140} downloadable downloadFileName={`${handle}-qr.png`} />

      <Card className="flex w-full items-center justify-between gap-3">
        <span className="truncate text-sm text-white/80">{url}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 text-sm text-white/60 hover:text-white"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </Card>

      <div className="flex w-full gap-3">
        <Link href={`/dashboard/${pageId}` as never} className="flex-1">
          <Button variant="outline" className="w-full">
            Go to full editor
          </Button>
        </Link>
        <Button
          className="flex-1"
          loading={setStatus.isPending}
          onClick={() => setStatus.mutate({ id: pageId, status: 'PUBLISHED' })}
        >
          Publish now
        </Button>
      </div>
    </div>
  );
}
