'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, cn } from '@amplifyworld/ui';
import type { UserRole } from '@amplifyworld/database';
import { trpc } from '../lib/trpc/client';
import { startDemoSession, startDemoFanSession } from '../server/services/demo/start-demo-session';

interface NavLink {
  href: string;
  label: string;
}

/**
 * The dashboard header's nav links + persona/plan badges, plus (in demo mode)
 * a one-click Artist/Fan switcher. A client component (needs `usePathname`
 * for active-link state) so the Fan/Artist split — real server-side gating in
 * `dashboard/(artist)/layout.tsx` — is also visible, not just enforced
 * silently.
 */
export function DashboardNav({ role, demoModeEnabled }: { role: UserRole; demoModeEnabled: boolean }) {
  const pathname = usePathname();
  const balance = trpc.amps.myBalance.useQuery(undefined, { enabled: role !== 'FAN' });

  const links: NavLink[] = [{ href: '/dashboard/discover', label: 'Discover' }, { href: '/dashboard/predictions', label: 'Predictions' }];
  if (role !== 'FAN') {
    links.unshift({ href: '/dashboard', label: 'Your Hub' });
  }
  if (role === 'ADMIN') {
    links.push(
      { href: '/dashboard/admin/momentum', label: 'Rising Artists' },
      { href: '/dashboard/admin/api-keys', label: 'API Keys' },
    );
  }

  const isPro = (balance.data?.unlockedThemes.length ?? 0) > 0;

  return (
    <div className="flex items-center gap-4">
      {links.map((link) => {
        const active = link.href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href as never}
            className={cn('text-sm transition-colors', active ? 'font-medium text-white' : 'text-white/60 hover:text-white')}
          >
            {link.label}
          </Link>
        );
      })}
      {role !== 'FAN' ? (
        <Link href="/dashboard/upgrade">
          <Badge tone={isPro ? 'brand' : 'neutral'} className="cursor-pointer">
            {isPro ? 'Pro' : 'Free plan'}
          </Badge>
        </Link>
      ) : null}
      {demoModeEnabled && (role === 'ARTIST' || role === 'FAN') ? (
        <div
          className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5"
          role="group"
          aria-label="Switch demo view"
        >
          <form action={startDemoSession}>
            <button
              type="submit"
              disabled={role === 'ARTIST'}
              title={role === 'ARTIST' ? 'Viewing as Artist' : 'Switch to Artist view'}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors',
                role === 'ARTIST' ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white',
              )}
            >
              Artist
            </button>
          </form>
          <form action={startDemoFanSession}>
            <button
              type="submit"
              disabled={role === 'FAN'}
              title={role === 'FAN' ? 'Viewing as Fan' : 'Switch to Fan view'}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors',
                role === 'FAN' ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white',
              )}
            >
              Fan
            </button>
          </form>
        </div>
      ) : (
        <Badge tone="neutral">{role === 'FAN' ? 'Fan' : 'Artist'}</Badge>
      )}
    </div>
  );
}
