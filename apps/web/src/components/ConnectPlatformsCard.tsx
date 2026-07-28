'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { SocialBlockConfig } from '@amplifyworld/core';
import { Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';
import { platformIcon, platformLabel } from './blocks/SocialBlockView';
import { platformUrl } from '../lib/platform-urls';

type Platform = SocialBlockConfig['platform'];

const CONNECTABLE_PLATFORMS = (Object.keys(platformLabel) as Platform[]).filter((platform) => platform !== 'other');

/**
 * Demo-only: simulates connecting a DSP/social account via OAuth (a brief
 * "Connecting…" state, then success) instead of the manual handle+URL form
 * the "Smart links" block editor uses — there's no real OAuth app for any
 * of these platforms to wire up. On success, creates the same `social`
 * block a manual add would, so the public page and AMI breakdown treat it
 * identically either way.
 */
export function ConnectPlatformsCard({
  pageId,
  pageHandle,
  connectedPlatforms,
}: {
  pageId: string;
  pageHandle: string;
  connectedPlatforms: Platform[];
}) {
  const utils = trpc.useUtils();
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const createBlock = trpc.block.create.useMutation({
    onSuccess: () => utils.page.getById.invalidate({ id: pageId }),
  });

  const connectedSet = new Set(connectedPlatforms);

  async function handleConnect(platform: Platform) {
    setConnecting(platform);
    await new Promise((resolve) => setTimeout(resolve, 900)); // simulated OAuth handshake
    try {
      await createBlock.mutateAsync({
        pageId,
        type: 'social',
        config: { platform, handle: pageHandle, url: platformUrl(platform, pageHandle) },
      });
    } finally {
      setConnecting(null);
    }
  }

  return (
    <Card className="gap-3">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Connect your platforms</span>
        <p className="mt-0.5 text-xs text-white/35">
          Simulated for this demo — click Connect and it links instantly, no real account needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {CONNECTABLE_PLATFORMS.map((platform) => {
          const Icon = platformIcon[platform];
          const isConnected = connectedSet.has(platform);
          const isConnecting = connecting === platform;
          return (
            <button
              key={platform}
              type="button"
              disabled={isConnected || isConnecting}
              onClick={() => handleConnect(platform)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default
                border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white
                disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]
                data-[connected=true]:border-emerald-500/30 data-[connected=true]:bg-emerald-500/10 data-[connected=true]:text-emerald-300"
              data-connected={isConnected}
            >
              <Icon className="size-3.5" />
              {platformLabel[platform]}
              {isConnecting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : isConnected ? (
                <Check className="size-3" />
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
