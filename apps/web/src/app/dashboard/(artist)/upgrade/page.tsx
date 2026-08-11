'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Lock, Rocket } from 'lucide-react';
import { THEME_PRESETS } from '@amplifyworld/core';
import { Button, Card, Badge } from '@amplifyworld/ui';
import { trpc } from '../../../../lib/trpc/client';

const BOOST_COST = 300;
const BOOST_DAYS = 7;

/**
 * The one place premium $AMPS spends live side by side: theme unlocks (today
 * only ever reachable from a disabled swatch in PageSettingsForm — this gives
 * `amps.unlockTheme` its first real caller) and the Discover boost, framed as
 * a Free-vs-Pro comparison. Still just AMPS spends under the hood, no new
 * payment rail — this is a framing layer over `amps.unlockTheme`/`boostPage`.
 */
export default function UpgradePage() {
  const utils = trpc.useUtils();
  const balance = trpc.amps.myBalance.useQuery();
  const pages = trpc.page.listMine.useQuery();
  const unlockTheme = trpc.amps.unlockTheme.useMutation({ onSuccess: () => utils.amps.myBalance.invalidate() });
  const boostPage = trpc.amps.boostPage.useMutation({ onSuccess: () => utils.amps.myBalance.invalidate() });

  const unlockedThemes = balance.data?.unlockedThemes ?? [];
  const freePresets = THEME_PRESETS.filter((preset) => !preset.isPremium);
  const proPresets = THEME_PRESETS.filter((preset) => preset.isPremium);
  const pageId = pages.data?.[0]?.id;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-3.5" />
          Back to your hub
        </Link>
        <h1 className="text-lg font-semibold leading-tight">Upgrade</h1>
        <p className="mt-0.5 text-sm text-white/50">
          Spend $AMPS you&apos;ve earned from predicting to unlock premium themes and Discover boosts. Fictional points
          only — see your balance below.
        </p>
      </div>

      {balance.data ? (
        <Card className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Your $AMPS balance</span>
          <span className="text-2xl font-semibold tabular-nums">{balance.data.balance.toLocaleString()}</span>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Free</Badge>
            <span className="text-sm font-medium">Included with every page</span>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li>1 published page</li>
            <li>All 4 page templates (Minimal Links, Release Drop, Tour Dates, Merch Drop)</li>
            <li>Full AMI score, confidence indicator, and smart-link tracking</li>
            {freePresets.map((preset) => (
              <li key={preset.key} className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                {preset.displayName} accent color
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-3 border-brand-400/30">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Pro</Badge>
            <span className="text-sm font-medium">Spend $AMPS to unlock</span>
          </div>
          <p className="text-sm text-white/70">
            Unlocking any premium theme below also lifts the free plan&apos;s 1-published-page limit and unlocks the
            compact layout, for as long as you hold it.
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            {proPresets.map((preset) => {
              const unlocked = unlockedThemes.includes(preset.key);
              return (
                <li key={preset.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-white/70">
                    <span className="size-3 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                    {preset.displayName} theme
                  </span>
                  {unlocked ? (
                    <Badge tone="success">
                      <Check className="size-3" /> Unlocked
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Lock className="size-3.5" />}
                      loading={unlockTheme.isPending && unlockTheme.variables?.themeKey === preset.key}
                      onClick={() => unlockTheme.mutate({ themeKey: preset.key })}
                    >
                      {preset.ampsCost} AMPS
                    </Button>
                  )}
                </li>
              );
            })}
            <li className="flex items-center justify-between gap-2 border-t border-white/8 pt-3">
              <span className="text-white/70">Boost your page in Discover ({BOOST_DAYS} days)</span>
              <Button
                variant="outline"
                size="sm"
                icon={<Rocket className="size-3.5" />}
                loading={boostPage.isPending}
                disabled={!pageId}
                onClick={() => pageId && boostPage.mutate({ pageId })}
              >
                {BOOST_COST} AMPS
              </Button>
            </li>
          </ul>
          {unlockTheme.error ? <p className="text-xs text-red-300">{unlockTheme.error.message}</p> : null}
          {boostPage.error ? <p className="text-xs text-red-300">{boostPage.error.message}</p> : null}
          {boostPage.data ? <Badge tone="success">Boosted for {BOOST_DAYS} days</Badge> : null}
        </Card>
      </div>
    </div>
  );
}
