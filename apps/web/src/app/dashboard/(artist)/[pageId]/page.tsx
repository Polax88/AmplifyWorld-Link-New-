'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ArrowLeft, RefreshCw, Smartphone, Eye, MousePointerClick, Settings } from 'lucide-react';
import type { SocialBlockConfig } from '@amplifyworld/core';
import { pageThemeSchema } from '@amplifyworld/core';
import { Button, Card, IconButton, Modal } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';
import { blockTypeIcon } from '../../../../components/blocks/blockTypeIcon';
import { BlockConfigForm } from '../../../../components/blocks/BlockConfigForm';
import { PagePreview } from '../../../../components/PagePreview';
import { PageSettingsForm } from '../../../../components/PageSettingsForm';
import { ShareQrButton } from '../../../../components/ShareQrButton';
import { MomentumPanel } from '../../../../components/MomentumPanel';
import { HubWelcomeBanner } from '../../../../components/HubWelcomeBanner';
import { AmpsBalanceCard } from '../../../../components/AmpsBalanceCard';
import { ConnectedPlatformsCard } from '../../../../components/ConnectedPlatformsCard';
import { ConnectPlatformsCard } from '../../../../components/ConnectPlatformsCard';
import { FansCard } from '../../../../components/FansCard';
import { PassesCard } from '../../../../components/PassesCard';
import { TemplatePicker } from '../../../../components/TemplatePicker';
import { TrackingHygieneCard } from '../../../../components/TrackingHygieneCard';
import { useDashboardContext } from '../../../../components/DashboardContext';
import { SortableBlockCard } from './SortableBlockCard';

export default function PageEditor({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const utils = trpc.useUtils();
  const { viberateEnabled, demoModeEnabled } = useDashboardContext();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const pageQuery = trpc.page.getById.useQuery({ id: pageId });
  const page = pageQuery.data;
  const summary = trpc.analytics.summaryForPage.useQuery({ pageId });
  const ampsBalance = trpc.amps.myBalance.useQuery();

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
  const regenerateDemoData = trpc.page.regenerateDemoData.useMutation({
    onSuccess: () => {
      invalidatePage();
      utils.momentum.forPage.invalidate({ pageId });
      utils.fan.listForPage.invalidate({ pageId });
    },
  });

  if (pageQuery.isLoading || !page) {
    return <p className="text-white/50">Loading…</p>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!page || !over || active.id === over.id) return;
    const oldIndex = page.blocks.findIndex((b) => b.id === active.id);
    const newIndex = page.blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(page.blocks, oldIndex, newIndex);
    reorder.mutate({ pageId, orderedBlockIds: reordered.map((b) => b.id) });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard?view=all">
              <IconButton aria-label="Your pages" variant="secondary">
                <ArrowLeft className="size-4" />
              </IconButton>
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-400">Your artist hub</p>
              <h1 className="text-lg font-semibold leading-tight">{page.title}</h1>
              <p className="text-sm text-white/50">amplify.world/{page.handle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {demoModeEnabled ? (
              <IconButton
                aria-label="Regenerate demo data"
                variant="secondary"
                onClick={() => regenerateDemoData.mutate({ pageId })}
                disabled={regenerateDemoData.isPending}
              >
                <RefreshCw className={regenerateDemoData.isPending ? 'size-4 animate-spin' : 'size-4'} />
              </IconButton>
            ) : null}
            <ShareQrButton handle={page.handle} />
            <IconButton aria-label="Edit page settings" variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Settings className="size-4" />
            </IconButton>
            <Button
              variant="outline"
              size="sm"
              icon={<Smartphone className="size-3.5" />}
              className="lg:hidden"
              onClick={() => setMobilePreviewOpen(true)}
            >
              Preview
            </Button>
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
        </div>

        {setStatus.error ? <p className="-mt-2 text-xs text-red-400">{setStatus.error.message}</p> : null}

        {summary.data ? (
          <div className="-mt-2 flex items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              {summary.data.views} {summary.data.views === 1 ? 'view' : 'views'}
            </span>
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="size-3.5" />
              {summary.data.clicks} {summary.data.clicks === 1 ? 'click' : 'clicks'}
            </span>
          </div>
        ) : null}

        <HubWelcomeBanner pageId={pageId} />

        <TemplatePicker pageId={pageId} currentTemplateKey={page.templateKey} />

        <TrackingHygieneCard pageId={pageId} onFix={setEditingBlockId} />

        <MomentumPanel
          pageId={pageId}
          pageTitle={page.title}
          pageHandle={page.handle}
          viberateConnected={Boolean(page.viberateArtistId)}
        />

        <AmpsBalanceCard pageId={pageId} />

        <div id="connected-platforms">
          <ConnectedPlatformsCard
            pageId={pageId}
            socialBlocks={page.blocks
              .filter((block) => block.type === 'social')
              .map((block) => ({ id: block.id, config: block.config as SocialBlockConfig }))}
            viberateEnabled={viberateEnabled}
            viberateArtistId={page.viberateArtistId}
            viberateConnectedAt={page.viberateConnectedAt}
          />
        </div>

        {demoModeEnabled ? (
          <ConnectPlatformsCard
            pageId={pageId}
            pageHandle={page.handle}
            connectedPlatforms={page.blocks
              .filter((block) => block.type === 'social')
              .map((block) => (block.config as SocialBlockConfig).platform)}
          />
        ) : null}

        <FansCard pageId={pageId} />

        <PassesCard pageId={pageId} />

        <section id="smart-links" className="flex flex-col gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Smart links</h2>
            <p className="mt-0.5 text-xs text-white/35">
              Everything a fan sees on your page, in the order they see it.
            </p>
          </div>

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

          {page.blocks.length === 0 ? (
            <Card className="items-center py-8 text-center text-sm text-white/50">
              No smart links yet — add one above.
            </Card>
          ) : null}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {page.blocks.map((block) => (
                <SortableBlockCard
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  isEnabled={block.isEnabled}
                  isEditing={editingBlockId === block.id}
                  onToggleEnabled={() => setEnabled.mutate({ id: block.id, isEnabled: !block.isEnabled })}
                  onToggleEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                  onDelete={() => deleteBlock.mutate({ id: block.id })}
                >
                  <BlockConfigForm
                    type={block.type}
                    config={block.config}
                    saving={updateConfig.isPending}
                    onSave={(config) => updateConfig.mutate({ id: block.id, config })}
                  />
                </SortableBlockCard>
              ))}
            </SortableContext>
          </DndContext>
        </section>
      </div>

      <div className="hidden justify-self-center lg:sticky lg:top-24 lg:flex">
        <PagePreview
          title={page.title}
          bio={page.bio}
          avatarUrl={page.avatarUrl}
          blocks={page.blocks}
          theme={pageThemeSchema.parse(page.theme)}
          handle={page.handle}
        />
      </div>

      <Modal
        open={mobilePreviewOpen}
        onOpenChange={setMobilePreviewOpen}
        title="Live preview"
        className="flex w-auto max-w-none justify-center border-none bg-transparent p-0 shadow-none"
      >
        <PagePreview
          title={page.title}
          bio={page.bio}
          avatarUrl={page.avatarUrl}
          blocks={page.blocks}
          theme={pageThemeSchema.parse(page.theme)}
          handle={page.handle}
        />
      </Modal>

      <Modal open={settingsOpen} onOpenChange={setSettingsOpen} title="Page settings">
        <PageSettingsForm
          pageId={page.id}
          initialTitle={page.title}
          initialBio={page.bio ?? ''}
          initialAvatarUrl={page.avatarUrl ?? ''}
          initialThemeKey={pageThemeSchema.parse(page.theme).themeKey}
          initialLayout={pageThemeSchema.parse(page.theme).layout}
          unlockedThemes={ampsBalance.data?.unlockedThemes ?? []}
          onSaved={() => {
            invalidatePage();
            setSettingsOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
