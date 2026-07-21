'use client';

import Link from 'next/link';
import { Button, Card } from '@amplifyworld/ui';
import { trpc } from '../../lib/trpc/client';

export default function DashboardPage() {
  const utils = trpc.useUtils();
  const pages = trpc.page.listMine.useQuery();
  const createPage = trpc.page.create.useMutation({
    onSuccess: () => utils.page.listMine.invalidate(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your pages</h1>
        <Button
          onClick={() => {
            const handle = window.prompt('Page handle (e.g. your-artist-name)');
            if (!handle) return;
            createPage.mutate({ handle, title: handle });
          }}
        >
          New page
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {pages.data?.map((page) => (
          <Link key={page.id} href={`/dashboard/${page.id}` as never}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-sm text-white/60">/{page.handle}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-white/50">{page.status}</span>
            </Card>
          </Link>
        ))}
        {pages.data?.length === 0 ? (
          <p className="text-white/60">No pages yet — create your first one above.</p>
        ) : null}
      </div>
    </div>
  );
}
