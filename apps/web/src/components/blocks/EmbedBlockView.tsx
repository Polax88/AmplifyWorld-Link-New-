import type { EmbedBlockConfig } from '@amplifyworld/core';

export function EmbedBlockView({ config }: { config: EmbedBlockConfig }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
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
