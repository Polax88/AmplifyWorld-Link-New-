'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Select, Textarea } from '@amplifyworld/ui';
import type {
  LinkBlockConfig,
  SocialBlockConfig,
  EmbedBlockConfig,
  GatedContentBlockConfig,
  ConversionEventType,
} from '@amplifyworld/core';
import { CONVERSION_EVENT_TYPES, CONVERSION_EVENT_LABELS } from '@amplifyworld/core';
import { platformLabel } from './SocialBlockView';

/** Shared by the link and social forms — the classification the AMI Conversion pillar and tracking-hygiene indicator both key off. */
function ConversionTypeSelect({
  value,
  onChange,
}: {
  value: ConversionEventType;
  onChange: (value: ConversionEventType) => void;
}) {
  return (
    <Select
      label="Conversion type"
      value={value}
      onChange={(e) => onChange(e.target.value as ConversionEventType)}
      hint="What this link is meant to accomplish — feeds your AMI Conversion score and tracking."
    >
      {CONVERSION_EVENT_TYPES.map((type) => (
        <option key={type} value={type} className="bg-surface-raised">
          {CONVERSION_EVENT_LABELS[type]}
        </option>
      ))}
    </Select>
  );
}

interface FormProps<TConfig> {
  config: TConfig;
  onSave: (config: TConfig) => void;
  saving: boolean;
}

/**
 * Dashboard-only inline editor per block type. When a new block type is
 * added in @amplifyworld/core, add its form here and one case below —
 * the block list, drag/reorder, and persistence stay untouched.
 */
export function BlockConfigForm({
  type,
  config,
  onSave,
  saving,
}: {
  type: string;
  config: unknown;
  onSave: (config: unknown) => void;
  saving: boolean;
}) {
  switch (type) {
    case 'link':
      return <LinkForm config={config as LinkBlockConfig} onSave={onSave} saving={saving} />;
    case 'social':
      return <SocialForm config={config as SocialBlockConfig} onSave={onSave} saving={saving} />;
    case 'embed':
      return <EmbedForm config={config as EmbedBlockConfig} onSave={onSave} saving={saving} />;
    case 'gated-content':
      return <GatedContentForm config={config as GatedContentBlockConfig} onSave={onSave} saving={saving} />;
    default:
      return <p className="text-sm text-white/50">No editor available for &quot;{type}&quot;.</p>;
  }
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <Button type="submit" size="sm" loading={saving} className="self-start">
      Save
    </Button>
  );
}

function LinkForm({ config, onSave, saving }: FormProps<LinkBlockConfig>) {
  const [label, setLabel] = useState(config.label);
  const [url, setUrl] = useState(config.url);
  const [conversionType, setConversionType] = useState<ConversionEventType>(config.conversionType ?? 'generic');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...config, label, url, conversionType });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <Input label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <ConversionTypeSelect value={conversionType} onChange={setConversionType} />
      <SaveButton saving={saving} />
    </form>
  );
}

function SocialForm({ config, onSave, saving }: FormProps<SocialBlockConfig>) {
  const [platform, setPlatform] = useState(config.platform);
  const [handle, setHandle] = useState(config.handle);
  const [url, setUrl] = useState(config.url);
  const [conversionType, setConversionType] = useState<ConversionEventType>(config.conversionType ?? 'follow');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...config, platform, handle, url, conversionType });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Select
        label="Platform"
        value={platform}
        onChange={(e) => setPlatform(e.target.value as SocialBlockConfig['platform'])}
      >
        {(
          [
            'instagram',
            'tiktok',
            'youtube',
            'spotify',
            'apple_music',
            'soundcloud',
            'deezer',
            'facebook',
            'x',
            'discord',
            'other',
          ] as const
        ).map((p) => (
          <option key={p} value={p} className="bg-surface-raised">
            {platformLabel[p]}
          </option>
        ))}
      </Select>
      <Input label="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} required />
      <Input label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <ConversionTypeSelect value={conversionType} onChange={setConversionType} />
      <SaveButton saving={saving} />
    </form>
  );
}

function EmbedForm({ config, onSave, saving }: FormProps<EmbedBlockConfig>) {
  const [provider, setProvider] = useState(config.provider);
  const [embedUrl, setEmbedUrl] = useState(config.embedUrl);
  const [title, setTitle] = useState(config.title ?? '');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...config, provider, embedUrl, title: title || undefined });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Select
        label="Provider"
        value={provider}
        onChange={(e) => setProvider(e.target.value as EmbedBlockConfig['provider'])}
      >
        {(['spotify', 'youtube', 'soundcloud'] as const).map((p) => (
          <option key={p} value={p} className="bg-surface-raised">
            {p}
          </option>
        ))}
      </Select>
      <Input label="Embed URL" type="url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} required />
      <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <SaveButton saving={saving} />
    </form>
  );
}

function GatedContentForm({ config, onSave, saving }: FormProps<GatedContentBlockConfig>) {
  const [label, setLabel] = useState(config.label);
  const [integrationConnectionId, setIntegrationConnectionId] = useState(config.integrationConnectionId);
  const [unlockedUrl, setUnlockedUrl] = useState(config.unlockedUrl);
  const [lockedMessage, setLockedMessage] = useState(config.lockedMessage);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...config, label, integrationConnectionId, unlockedUrl, lockedMessage });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <Input
        label="Integration connection ID"
        value={integrationConnectionId}
        onChange={(e) => setIntegrationConnectionId(e.target.value)}
        hint="The IntegrationConnection this gate checks eligibility against."
        required
      />
      <Input
        label="Unlocked URL"
        type="url"
        value={unlockedUrl}
        onChange={(e) => setUnlockedUrl(e.target.value)}
        required
      />
      <Textarea label="Locked message" value={lockedMessage} onChange={(e) => setLockedMessage(e.target.value)} />
      <SaveButton saving={saving} />
    </form>
  );
}
