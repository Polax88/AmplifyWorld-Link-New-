'use client';

import { Heart } from 'lucide-react';
import type { TipJarBlockConfig } from '@amplifyworld/core';
import { trpc } from '../../lib/trpc/client';

export function TipJarBlockView({
  pageId,
  blockId,
  config,
}: {
  pageId: string;
  blockId: string;
  config: TipJarBlockConfig;
}) {
  const trackClick = trpc.analytics.trackBlockClick.useMutation();

  return (
    <a
      href={config.checkoutUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackClick.mutate({ pageId, blockId, blockType: 'tip-jar' })}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-400 to-accent px-5 py-4 text-sm font-semibold text-white shadow-glow transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
    >
      <Heart className="size-4 fill-white/90 transition-transform group-hover:scale-110" />
      {config.label}
    </a>
  );
}
