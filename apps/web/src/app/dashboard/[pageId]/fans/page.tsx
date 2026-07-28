'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { FansTable } from '../../../../components/FansTable';

export default function FansPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const page = trpc.page.getById.useQuery({ id: pageId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/${pageId}` as never}>
          <IconButton aria-label="Back to hub" variant="secondary">
            <ArrowLeft className="size-4" />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Fans</h1>
          <p className="text-sm text-white/50">
            Everyone who&apos;s subscribed to {page.data?.title ?? 'this page'}, and how they&apos;ve engaged.
          </p>
        </div>
      </div>

      <FansTable pageId={pageId} />
    </div>
  );
}
