'use client';

import { use } from 'react';
import { Button, Card } from '@amplifyworld/ui';
import { trpc } from '../../../lib/trpc/client';

export default function PageEditor({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const utils = trpc.useUtils();

  const pageQuery = trpc.page.getById.useQuery({ id: pageId });
  const page = pageQuery.data;

  const invalidatePage = () => utils.page.getById.invalidate({ id: pageId });
  const blockTypes = trpc.block.listAvailableTypes.useQuery();
  const addBlock = trpc.block.create.useMutation({ onSuccess: invalidatePage });
  const deleteBlock = trpc.block.delete.useMutation({ onSuccess: invalidatePage });
  const setStatus = trpc.page.setStatus.useMutation({ onSuccess: invalidatePage });

  if (!page) return <p className="text-white/60">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{page.title}</h1>
          <p className="text-sm text-white/60">/{page.handle}</p>
        </div>
        <Button
          variant={page.status === 'PUBLISHED' ? 'secondary' : 'primary'}
          onClick={() =>
            setStatus.mutate({ id: page.id, status: page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })
          }
        >
          {page.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-white/60">Add a block</h2>
        <div className="flex flex-wrap gap-2">
          {blockTypes.data?.map((type) => (
            <Button
              key={type.type}
              variant="ghost"
              className="border border-white/10"
              onClick={() => addBlock.mutate({ pageId: page.id, type: type.type })}
            >
              {type.displayName}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {page.blocks.map((block) => (
          <Card key={block.id} className="flex items-center justify-between">
            <span className="capitalize">{block.type}</span>
            <Button variant="ghost" onClick={() => deleteBlock.mutate({ id: block.id })}>
              Remove
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
