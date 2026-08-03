'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import { IconButton, Card, Badge, Avatar, Button } from '@amplifyworld/ui';
import { trpc } from '../../../../../../lib/trpc/client';
import { PassShareQrButton } from '../../../../../../components/PassShareQrButton';

type Tab = 'overview' | 'checkin';

export default function PassDetailPage({ params }: { params: Promise<{ pageId: string; passId: string }> }) {
  const { pageId, passId } = use(params);
  const [tab, setTab] = useState<Tab>('overview');
  const utils = trpc.useUtils();
  const pass = trpc.pass.getById.useQuery({ passId });
  const toggleCheckIn = trpc.pass.toggleCheckIn.useMutation({
    onSuccess: () => utils.pass.getById.invalidate({ passId }),
  });

  if (pass.isLoading || !pass.data) {
    return <p className="text-white/50">Loading…</p>;
  }

  const { holders } = pass.data;
  const checkedInCount = holders.filter((holder) => holder.checkedInAt).length;
  const checkedInPercent = holders.length > 0 ? Math.round((checkedInCount / holders.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${pageId}/passes` as never}>
            <IconButton aria-label="Back to passes" variant="secondary">
              <ArrowLeft className="size-4" />
            </IconButton>
          </Link>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: pass.data.accentColor }} />
            <div>
              <h1 className="text-lg font-semibold leading-tight">{pass.data.name}</h1>
              {pass.data.eventName ? <p className="text-sm text-white/50">{pass.data.eventName}</p> : null}
            </div>
          </div>
        </div>
        <PassShareQrButton passId={passId} />
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'overview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('overview')}>
          Overview
        </Button>
        <Button variant={tab === 'checkin' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('checkin')}>
          Check-in
        </Button>
      </div>

      {tab === 'overview' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="gap-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
                <Users className="size-3.5" />
                Holders
              </span>
              <span className="text-3xl font-semibold tabular-nums">{holders.length}</span>
            </Card>
            <Card className="gap-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
                <CheckCircle2 className="size-3.5" />
                Checked in
              </span>
              <span className="text-3xl font-semibold tabular-nums">
                {checkedInCount} <span className="text-base text-white/40">({checkedInPercent}%)</span>
              </span>
            </Card>
          </div>

          {holders.length > 0 ? (
            <Card className="gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Recently claimed</span>
              <div className="flex -space-x-2">
                {holders.slice(0, 8).map((holder) => (
                  <Avatar key={holder.id} name={holder.fan.email ?? 'Fan'} size="sm" className="ring-2 ring-surface" />
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Fan</th>
                <th className="px-4 py-3 font-medium">Claimed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {holders.map((holder) => (
                <tr key={holder.id} className="border-b border-white/5 last:border-none">
                  <td className="px-4 py-3">{holder.fan.email ?? 'Fan'}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(holder.claimedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge tone={holder.checkedInAt ? 'success' : 'neutral'}>
                      {holder.checkedInAt ? 'Checked in' : 'Not checked in'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={toggleCheckIn.isPending && toggleCheckIn.variables?.holderId === holder.id}
                      onClick={() => toggleCheckIn.mutate({ holderId: holder.id })}
                    >
                      {holder.checkedInAt ? 'Undo' : 'Check in'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
