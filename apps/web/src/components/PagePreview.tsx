import type { CSSProperties } from 'react';
import { Avatar, cn } from '@amplifyworld/ui';
import { getThemePreset, type PageThemeConfig } from '@amplifyworld/core';
import { BlockRenderer, type RenderableBlock } from './blocks/BlockRenderer';

export interface PreviewBlock extends RenderableBlock {
  isEnabled: boolean;
}

export function PagePreview({
  title,
  bio,
  avatarUrl,
  blocks,
  theme,
  handle,
}: {
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  blocks: PreviewBlock[];
  theme?: PageThemeConfig;
  /** Seeds each smart link's automatic UTM tagging — see `BlockRenderer`. Falls back to a placeholder for previews taken before a page has a real handle yet (e.g. the onboarding wizard's review step). */
  handle?: string;
}) {
  const preset = getThemePreset(theme?.themeKey ?? 'brand-pink');
  const compact = theme?.layout === 'compact';

  return (
    <div
      className="w-[300px] rounded-[2.5rem] border border-white/10 bg-black/40 p-3 shadow-glow"
      style={{ '--theme-accent': preset.accentColor } as CSSProperties}
    >
      <div className="mb-2 flex justify-center">
        <div className="h-1.5 w-16 rounded-full bg-white/15" />
      </div>
      <div
        className={cn(
          'flex h-[600px] flex-col items-center overflow-y-auto rounded-[2rem] bg-canvas px-5',
          compact ? 'gap-3 py-5' : 'gap-6 py-8',
        )}
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute size-24 rounded-full opacity-40 blur-2xl"
            style={{ background: 'var(--theme-accent)' }}
          />
          <Avatar src={avatarUrl} name={title || '?'} size="lg" ring className="relative" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold">{title || 'Untitled page'}</h2>
          {bio ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{bio}</p> : null}
        </div>
        <div className={cn('flex w-full flex-col', compact ? 'gap-1.5' : 'gap-2.5')}>
          {blocks
            .filter((block) => block.isEnabled)
            .map((block) => (
              <BlockRenderer key={block.id} block={block} pageHandle={handle ?? 'preview'} />
            ))}
          {blocks.length === 0 ? (
            <p className="text-center text-xs text-ink-faint">Add a block to see it here.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
