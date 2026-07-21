'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronUp, ChevronDown, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button, Card, IconButton, Badge } from '@amplifyworld/ui';
import { trpc } from '../../../lib/trpc/client';
import { blockTypeIcon } from '../../../components/blocks/blockTypeIcon';
import { BlockConfigForm } from '../../../components/blocks/BlockConfigForm';
import { PagePreview } from '../../../components/PagePreview';

export default function PageEditor({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const utils = trpc.useUtils();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const pageQuery = trpc.page.getById.useQuery({ id: pageId });
  const page = pageQuery.data;

  const invalidatePage = () => utils.page.getById.invalidate({ id: pageId });
  const blockTypes = trpc.block.listAvailableTypes.useQuery();
  const addBlock = trpc.block.create.useMutation({ onSuccess: invalidatePage });
  const deleteBlock = trpc.block.delete.useMutation({ onSuccess: invalidatePage });
  const setStatus = trpc.page.setStatus.useMutation({ onSuccess: invalidatePage });
  const setEnabled = trpc.block.setEnabled.useMutation({ onSuccess: invalidatePage });
  const reorder = trpc.block.reorder.useMutation({ onSuccess: invalidatePage });
  const updateConfig = trpc.block.updateConfig.useMutation({
    onSuccess: () => {
      invalidatePage();
      setEditingBlockId(null);
    },
  });

  if (pageQuery.isLoading || !page) {
    return <p className="text-white/50">Loading…</p>;
  }

  function move(index: number, direction: -1 | 1) {
    if (!page) return;
    const ids = page.blocks.map((b) => b.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate({ pageId, orderedBlockIds: ids });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <IconButton aria-label="Back to pages" variant="secondary">
                <ArrowLeft className="size-4" />
              </IconButton>
            </Link>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{page.title}</h1>
              <p className="text-sm text-white/50">amplify.world/{page.handle}</p>
            </div>
          </div>
          <Button
            variant={page.status === 'PUBLISHED' ? 'secondary' : 'primary'}
            loading={setStatus.isPending}
            onClick={() =>
              setStatus.mutate({
                id: page.id,
                status: page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
              })
            }
          >
            {page.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>

        <section>
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-white/50">Add a block</h2>
          <div className="flex flex-wrap gap-2">
            {blockTypes.data?.map((type) => {
              const Icon = blockTypeIcon[type.type];
              return (
                <Button
                  key={type.type}
                  variant="outline"
                  size="sm"
                  icon={Icon ? <Icon className="size-3.5" /> : undefined}
                  loading={addBlock.isPending && addBlock.variables?.type === type.type}
                  onClick={() => addBlock.mutate({ pageId: page.id, type: type.type })}
                >
                  {type.displayName}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Blocks</h2>
          {page.blocks.length === 0 ? (
            <Card className="items-center py-8 text-center text-sm text-white/50">
              No blocks yet — add one above.
            </Card>
          ) : null}
          {page.blocks.map((block, index) => {
            const Icon = blockTypeIcon[block.type];
            const isEditing = editingBlockId === block.id;
            return (
              <Card key={block.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {Icon ? (
                      <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-white/60">
                        <Icon className="size-4" />
                      </span>
                    ) : null}
                    <div>
                      <p className="text-sm font-medium capitalize text-white">
                        {block.type.replace('-', ' ')}
                      </p>
                      {!block.isEnabled ? (
                        <Badge tone="neutral" className="mt-0.5">
                          Hidden
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      aria-label="Move up"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </IconButton>
                    <IconButton
                      aria-label="Move down"
                      size="sm"
                      disabled={index === page.blocks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </IconButton>
                    <IconButton
                      aria-label={block.isEnabled ? 'Hide block' : 'Show block'}
                      size="sm"
                      onClick={() => setEnabled.mutate({ id: block.id, isEnabled: !block.isEnabled })}
                    >
                      {block.isEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </IconButton>
                    <IconButton
                      aria-label="Edit block"
                      size="sm"
                      onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                    >
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      aria-label="Delete block"
                      size="sm"
                      variant="danger"
                      onClick={() => deleteBlock.mutate({ id: block.id })}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>

                {isEditing ? (
                  <div className="border-t border-white/10 pt-3">
                    <BlockConfigForm
                      type={block.type}
                      config={block.config}
                      saving={updateConfig.isPending}
                      onSave={(config) => updateConfig.mutate({ id: block.id, config })}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </section>
      </div>

      <div className="hidden justify-self-center lg:sticky lg:top-24 lg:flex">
        <PagePreview title={page.title} bio={page.bio} avatarUrl={page.avatarUrl} blocks={page.blocks} />
      </div>
    </div>
  );
}
