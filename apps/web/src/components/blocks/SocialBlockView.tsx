import type { SocialBlockConfig } from '@amplifyworld/core';

export function SocialBlockView({ config }: { config: SocialBlockConfig }) {
  return (
    <a
      href={config.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm"
    >
      <span className="capitalize">{config.platform}</span>
      <span className="text-white/60">@{config.handle}</span>
    </a>
  );
}
