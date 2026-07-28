import type { LinkBlockConfig, SocialBlockConfig, EmbedBlockConfig, GatedContentBlockConfig } from '@amplifyworld/core';
import { LinkBlockView } from './LinkBlockView';
import { SocialBlockView } from './SocialBlockView';
import { EmbedBlockView } from './EmbedBlockView';
import { GatedContentBlockView } from './GatedContentBlockView';

export interface RenderableBlock {
  id: string;
  pageId: string;
  type: string;
  config: unknown;
}

/**
 * Maps a persisted block's `type` to its view component. Adding a new block
 * kind means: (1) define it in `@amplifyworld/core`, (2) add a `*BlockView`
 * component, (3) add one line here. Nothing else in the render path changes.
 */
export function BlockRenderer({ block }: { block: RenderableBlock }) {
  switch (block.type) {
    case 'link':
      return <LinkBlockView pageId={block.pageId} blockId={block.id} config={block.config as LinkBlockConfig} />;
    case 'social':
      return <SocialBlockView config={block.config as SocialBlockConfig} />;
    case 'embed':
      return <EmbedBlockView config={block.config as EmbedBlockConfig} />;
    case 'gated-content':
      return <GatedContentBlockView config={block.config as GatedContentBlockConfig} />;
    default:
      return null;
  }
}
