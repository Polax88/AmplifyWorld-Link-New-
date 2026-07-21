import { Avatar } from '@amplifyworld/ui';
import { BlockRenderer, type RenderableBlock } from './blocks/BlockRenderer';

export interface PreviewBlock extends RenderableBlock {
  isEnabled: boolean;
}

export function PagePreview({
  title,
  bio,
  avatarUrl,
  blocks,
}: {
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  blocks: PreviewBlock[];
}) {
  return (
    <div className="w-[300px] rounded-[2.5rem] border border-white/10 bg-black/40 p-3 shadow-glow">
      <div className="mb-2 flex justify-center">
        <div className="h-1.5 w-16 rounded-full bg-white/15" />
      </div>
      <div className="flex h-[600px] flex-col items-center gap-6 overflow-y-auto rounded-[2rem] bg-canvas px-5 py-8">
        <Avatar src={avatarUrl} name={title || '?'} size="lg" ring />
        <div className="text-center">
          <h2 className="text-base font-semibold">{title || 'Untitled page'}</h2>
          {bio ? <p className="mt-1 text-xs leading-relaxed text-white/60">{bio}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2.5">
          {blocks
            .filter((block) => block.isEnabled)
            .map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          {blocks.length === 0 ? (
            <p className="text-center text-xs text-white/30">Add a block to see it here.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
