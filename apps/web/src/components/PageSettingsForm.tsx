'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Lock, Check } from 'lucide-react';
import { THEME_PRESETS } from '@amplifyworld/core';
import { Button, Input, Textarea, Card, cn } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

interface PageSettingsFormProps {
  pageId: string;
  initialTitle: string;
  initialBio: string;
  initialAvatarUrl: string;
  initialThemeKey: string;
  initialLayout: 'standard' | 'compact';
  unlockedThemes: string[];
  onSaved: () => void;
}

export function PageSettingsForm({
  pageId,
  initialTitle,
  initialBio,
  initialAvatarUrl,
  initialThemeKey,
  initialLayout,
  unlockedThemes,
  onSaved,
}: PageSettingsFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [themeKey, setThemeKey] = useState(initialThemeKey);
  const [layout, setLayout] = useState<'standard' | 'compact'>(initialLayout);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  const suggestBio = trpc.page.suggestBio.useQuery({ pageId }, { enabled: false });
  const update = trpc.page.update.useMutation({ onSuccess: onSaved });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate({ id: pageId, title, bio, avatarUrl, theme: { themeKey, layout } });
  }

  async function handleWriteWithAi() {
    const result = await suggestBio.refetch();
    if (result.data) setSuggestions(result.data.suggestions);
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <Input label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input
        label="Avatar URL"
        type="url"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        hint="Leave blank to use your initials."
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/70">Bio</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Sparkles className="size-3.5" />}
            loading={suggestBio.isFetching}
            onClick={handleWriteWithAi}
          >
            Write with AI
          </Button>
        </div>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} />
        {suggestions ? (
          <div className="flex flex-col gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setBio(suggestion);
                  setSuggestions(null);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-white/70 transition-colors hover:border-brand-400/50 hover:bg-white/[0.06] hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/70">Theme</label>
        <div className="grid grid-cols-5 gap-2">
          {THEME_PRESETS.map((preset) => {
            const locked = preset.isPremium && !unlockedThemes.includes(preset.key);
            const selected = themeKey === preset.key;
            const swatchClassName = cn(
              'relative flex aspect-square items-center justify-center rounded-xl border transition-all',
              selected ? 'border-white/60 ring-2 ring-white/30' : 'border-white/10 hover:border-white/30',
            );

            if (locked) {
              return (
                <Link
                  key={preset.key}
                  href="/dashboard/upgrade"
                  title={`Unlock for ${preset.ampsCost} AMPS`}
                  className={swatchClassName}
                  style={{ backgroundColor: preset.accentColor }}
                >
                  <Lock className="size-3.5 text-white drop-shadow" />
                </Link>
              );
            }

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setThemeKey(preset.key)}
                title={preset.displayName}
                className={swatchClassName}
                style={{ backgroundColor: preset.accentColor }}
              >
                {selected ? <Check className="size-3.5 text-white drop-shadow" /> : null}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-white/35">
          Locked themes unlock by spending $AMPS —{' '}
          <Link href="/dashboard/upgrade" className="text-white/50 underline hover:text-white">
            see all Pro perks
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/70">Layout</label>
        <div className="flex gap-2">
          {(['standard', 'compact'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant={layout === option ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setLayout(option)}
            >
              {option === 'standard' ? 'Standard' : 'Compact'}
            </Button>
          ))}
        </div>
      </div>

      {update.error ? <Card className="py-2 text-xs text-red-300">{update.error.message}</Card> : null}

      <Button type="submit" loading={update.isPending} className="self-start">
        Save changes
      </Button>
    </form>
  );
}
