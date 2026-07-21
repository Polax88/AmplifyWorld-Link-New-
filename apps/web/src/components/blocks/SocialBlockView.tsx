import { Instagram, Youtube, Music2, Video, MessageCircle, Globe, AtSign, type LucideIcon } from 'lucide-react';
import type { SocialBlockConfig } from '@amplifyworld/core';

const platformIcon: Record<SocialBlockConfig['platform'], LucideIcon> = {
  instagram: Instagram,
  youtube: Youtube,
  spotify: Music2,
  tiktok: Video,
  x: AtSign,
  discord: MessageCircle,
  other: Globe,
};

export function SocialBlockView({ config }: { config: SocialBlockConfig }) {
  const Icon = platformIcon[config.platform];

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition-all duration-150 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    >
      <Icon className="size-4 text-white/50 group-hover:text-brand-400" />
      <span className="capitalize">{config.platform}</span>
      <span className="text-white/40">@{config.handle}</span>
    </a>
  );
}
