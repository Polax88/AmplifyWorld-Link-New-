'use client';

import { useState } from 'react';
import { Eye, EyeOff, Smartphone } from 'lucide-react';
import { Button, Card, Textarea, Modal } from '@amplifyworld/ui';
import { trpc } from '../../../lib/trpc/client';
import { blockTypeIcon } from '../../../components/blocks/blockTypeIcon';
import { PagePreview } from '../../../components/PagePreview';
import type { WizardState } from './types';

export function ReviewStep({
  state,
  onUpdate,
  onCommitted,
}: {
  state: WizardState;
  onUpdate: (updater: (prev: WizardState) => WizardState) => void;
  onCommitted: () => void;
}) {
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const draftMutation = trpc.onboarding.draft.useMutation();
  const commitMutation = trpc.onboarding.commit.useMutation();

  function handleRegenerate() {
    draftMutation.mutate(
      {
        pageId: state.pageId,
        stageName: state.stageName,
        genre: state.genre.trim() || undefined,
        spotifyArtistId: state.spotifyArtistId ?? undefined,
        socialHandles: state.socialHandles.length > 0 ? state.socialHandles : undefined,
      },
      {
        onSuccess: (draft) => {
          onUpdate((prev) => ({
            ...prev,
            bio: draft.bio,
            avatarUrl: draft.avatarUrl ?? prev.avatarUrl,
            blocks: draft.suggestedBlocks.map((block) => ({
              tempId: crypto.randomUUID(),
              type: block.type,
              config: block.config,
              keep: true,
            })),
          }));
        },
      },
    );
  }

  function toggleBlock(tempId: string) {
    onUpdate((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.tempId === tempId ? { ...b, keep: !b.keep } : b)),
    }));
  }

  function handleCommit() {
    commitMutation.mutate(
      {
        pageId: state.pageId,
        bio: state.bio,
        avatarUrl: state.avatarUrl ?? undefined,
        blocks: state.blocks.filter((b) => b.keep).map((b) => ({ type: b.type, config: b.config })),
      },
      { onSuccess: onCommitted },
    );
  }

  const previewBlocks = state.blocks.map((block) => ({
    id: block.tempId,
    pageId: state.pageId,
    type: block.type,
    config: block.config,
    isEnabled: block.keep,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Here&apos;s your draft</h1>
            <p className="mt-1 text-sm text-white/60">Edit anything below, or regenerate for a new take.</p>
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
          maxLength={280}
          value={state.bio}
          onChange={(event) => onUpdate((prev) => ({ ...prev, bio: event.target.value }))}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Suggested blocks</span>
          {state.blocks.map((block) => {
            const Icon = blockTypeIcon[block.type];
            return (
              <Card key={block.tempId} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {Icon ? (
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-white/60">
                      <Icon className="size-4" />
                    </span>
                  ) : null}
                  <span className="text-sm font-medium capitalize text-white">
                    {block.type.replace('-', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBlock(block.tempId)}
                  className="text-white/50 hover:text-white"
                  aria-label={block.keep ? 'Remove block' : 'Keep block'}
                >
                  {block.keep ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" loading={draftMutation.isPending} onClick={handleRegenerate}>
            Regenerate
          </Button>
          <Button className="flex-1" loading={commitMutation.isPending} onClick={handleCommit}>
            Create my page
          </Button>
        </div>
      </div>

      <div className="hidden justify-self-center lg:sticky lg:top-24 lg:flex">
        <PagePreview title={state.stageName} bio={state.bio} avatarUrl={state.avatarUrl} blocks={previewBlocks} />
      </div>

      <Modal
        open={mobilePreviewOpen}
        onOpenChange={setMobilePreviewOpen}
        title="Live preview"
        className="flex justify-center bg-transparent border-none shadow-none p-0 max-w-none w-auto"
      >
        <PagePreview title={state.stageName} bio={state.bio} avatarUrl={state.avatarUrl} blocks={previewBlocks} />
      </Modal>
    </div>
  );
}
