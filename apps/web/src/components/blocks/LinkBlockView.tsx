'use client';

import { ArrowUpRight } from 'lucide-react';
import type { LinkBlockConfig } from '@amplifyworld/core';
import { buildUtmParams, appendUtmParams } from '@amplifyworld/core';
import { trpc } from '../../lib/trpc/client';

export function LinkBlockView({
  pageId,
  pageHandle,
  blockId,
  config,
}: {
  pageId: string;
  pageHandle: string;
  blockId: string;
  config: LinkBlockConfig;
}) {
  const trackClick = trpc.analytics.trackBlockClick.useMutation();
  const conversionType = config.conversionType ?? 'generic';
  const href = appendUtmParams(config.url, buildUtmParams(conversionType, pageHandle));

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackClick.mutate({ pageId, blockId, blockType: 'link', conversionType })}
      className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] active:translate-y-0"
    >
      <span>{config.label}</span>
      <ArrowUpRight className="size-4 text-white/40 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/80" />
    </a>
  );
}
