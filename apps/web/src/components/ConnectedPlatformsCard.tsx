'use client';

import { CheckCircle2 } from 'lucide-react';
import type { SocialBlockConfig } from '@amplifyworld/core';
import { Card, Badge } from '@amplifyworld/ui';
import { platformIcon, platformLabel } from './blocks/SocialBlockView';
import { ConnectViberateButton } from './ConnectViberateButton';

interface ConnectedPlatformsCardProps {
  pageId: string;
  socialBlocks: Array<{ id: string; config: SocialBlockConfig }>;
  viberateEnabled: boolean;
  viberateArtistId: string | null;
  viberateConnectedAt: Date | string | null;
}

/**
 * "At a glance" summary of an artist's connected socials/platforms — the
 * hub's second section, between the AMI panel and the smart-links editor.
 * Social links themselves are still added/edited via the smart links list
 * below; this is a read-only overview plus the Viberate connect affordance.
 */
export function ConnectedPlatformsCard({
  pageId,
  socialBlocks,
  viberateEnabled,
  viberateArtistId,
  viberateConnectedAt,
}: ConnectedPlatformsCardProps) {
  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Connected socials &amp; platforms
        </span>
        {viberateEnabled ? (
          viberateArtistId ? (
            <Badge tone="success">
              <CheckCircle2 className="size-3" />
              Viberate connected
            </Badge>
          ) : (
            <ConnectViberateButton pageId={pageId} />
          )
        ) : null}
      </div>

      {socialBlocks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {socialBlocks.map(({ id, config }) => {
            const Icon = platformIcon[config.platform];
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"
              >
                <Icon className="size-3.5 text-white/50" />
                {platformLabel[config.platform]}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-white/40">
          No social profiles added yet — add one from Smart links below
          {viberateEnabled && !viberateArtistId ? ', or connect Viberate to pull them in automatically' : ''}.
        </p>
      )}

      {viberateArtistId && viberateConnectedAt ? (
        <p className="text-[11px] text-white/35">
          Connected via Viberate on {new Date(viberateConnectedAt).toLocaleDateString()} — feeding cross-platform
          momentum data into your AMI score.
        </p>
      ) : null}
    </Card>
  );
}
