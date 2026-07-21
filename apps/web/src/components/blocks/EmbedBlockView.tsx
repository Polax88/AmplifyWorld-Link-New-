import { PlayCircle } from 'lucide-react';
import type { EmbedBlockConfig } from '@amplifyworld/core';

export function EmbedBlockView({ config }: { config: EmbedBlockConfig }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {config.title ? (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-medium text-white/60">
          <PlayCircle className="size-3.5" />
          {config.title}
        </div>
      ) : null}
      <iframe
        src={config.embedUrl}
        title={config.title ?? config.provider}
        className="h-[152px] w-full"
        loading="lazy"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
}
