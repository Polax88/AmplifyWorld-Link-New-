'use client';

import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';
import { Button, Card, Input, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

export function ApiKeyManager() {
  const utils = trpc.useUtils();
  const keys = trpc.apiKey.list.useQuery();
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = trpc.apiKey.create.useMutation({
    onSuccess: (result) => {
      setNewKey(result.plaintextKey);
      setLabel('');
      utils.apiKey.list.invalidate();
    },
  });
  const revoke = trpc.apiKey.revoke.useMutation({ onSuccess: () => utils.apiKey.list.invalidate() });

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {newKey ? (
        <Card className="gap-2 border-brand-500/30 bg-brand-500/[0.06]">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-400">
            <KeyRound className="size-3.5" />
            New key created — copy it now, it won&apos;t be shown again
          </span>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-black/30 px-3 py-2">
            <code className="truncate text-sm text-white/90">{newKey}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 text-sm text-white/60 hover:text-white"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Create a new key</span>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (label.trim()) create.mutate({ label: label.trim() });
          }}
        >
          <Input
            placeholder="e.g. Sony Music — Q3 partnership"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Button type="submit" loading={create.isPending} disabled={!label.trim()}>
            Create
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Last used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {keys.data?.map((key) => (
              <tr key={key.id} className="border-b border-white/5 last:border-none">
                <td className="px-4 py-3 font-medium">{key.label}</td>
                <td className="px-4 py-3 text-white/60">{new Date(key.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-white/60">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={key.revokedAt ? 'neutral' : 'success'}>{key.revokedAt ? 'Revoked' : 'Active'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {!key.revokedAt ? (
                    <button
                      type="button"
                      onClick={() => revoke.mutate({ id: key.id })}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Revoke
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {keys.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/50">
                  No API keys yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
