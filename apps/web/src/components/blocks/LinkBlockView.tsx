'use client';

import type { LinkBlockConfig } from '@amplifyworld/core';
import { Button } from '@amplifyworld/ui';
import { trpc } from '../../lib/trpc/client';

export function LinkBlockView({
  pageId,
  blockId,
  config,
}: {
  pageId: string;
  blockId: string;
  config: LinkBlockConfig;
}) {
  const trackClick = trpc.analytics.trackBlockClick.useMutation();

  return (
    <a
      href={config.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackClick.mutate({ pageId, blockId, blockType: 'link' })}
      className="block w-full"
    >
      <Button variant="secondary" className="w-full">
        {config.label}
      </Button>
    </a>
  );
}
