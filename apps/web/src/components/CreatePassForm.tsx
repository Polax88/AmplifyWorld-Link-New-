'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

const DEFAULT_ACCENT = '#ff4081';

export function CreatePassForm({ pageId, onCreated }: { pageId: string; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [imageUrl, setImageUrl] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');

  const create = trpc.pass.create.useMutation({ onSuccess: onCreated });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    create.mutate({
      pageId,
      name,
      accentColor,
      imageUrl,
      eventName: eventName || undefined,
      eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
      eventVenue: eventVenue || undefined,
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input label="Pass name" value={name} onChange={(e) => setName(e.target.value)} required />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/60">Accent color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="size-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
          />
          <span className="text-xs tabular-nums text-white/40">{accentColor}</span>
        </div>
      </div>

      <Input
        label="Image URL"
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        hint="Optional logo or hero image."
      />

      <div className="border-t border-white/8 pt-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Event details (optional)</p>
        <div className="flex flex-col gap-3">
          <Input label="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          <Input label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <Input label="Venue" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} />
        </div>
      </div>

      {create.error ? <Card className="py-2 text-xs text-red-300">{create.error.message}</Card> : null}

      <Button type="submit" loading={create.isPending} className="self-start">
        Create pass
      </Button>
    </form>
  );
}
