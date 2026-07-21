'use client';

import type { TipJarBlockConfig } from '@amplifyworld/core';
import { Button } from '@amplifyworld/ui';
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
      className="block w-full"
    >
      <Button variant="primary" className="w-full">
        {config.label}
      </Button>
    </a>
  );
}
