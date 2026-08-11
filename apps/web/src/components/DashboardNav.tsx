'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, KeyRound, LayoutDashboard, LineChart, TrendingUp, type LucideIcon } from 'lucide-react';
import { Badge, cn } from '@amplifyworld/ui';
import type { UserRole } from '@amplifyworld/database';
import { trpc } from '../lib/trpc/client';
import { startDemoSession, startDemoFanSession } from '../server/services/demo/start-demo-session';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

function navLinksForRole(role: UserRole): NavLink[] {
  const links: NavLink[] = [
    { href: '/dashboard/discover', label: 'Discover', icon: Compass },
    { href: '/dashboard/predictions', label: 'Predictions', icon: LineChart },
  ];
  if (role !== 'FAN') {
    links.unshift({ href: '/dashboard', label: 'Your Hub', icon: LayoutDashboard });
  }
  if (role === 'ADMIN') {
    links.push(
      { href: '/dashboard/admin/momentum', label: 'Rising Artists', icon: TrendingUp },
      { href: '/dashboard/admin/api-keys', label: 'API Keys', icon: KeyRound },
    );
  }
  return links;
}

/**
 * The dashboard's nav links + persona/plan badges, plus (in demo mode) a
 * one-click Artist/Fan switcher. Same underlying data rendered two ways:
 * a horizontal bar for the mobile top header (`variant="topbar"`, `<lg`)
 * and a vertical list for the desktop sidebar (`variant="sidebar"`, `lg:`
 * and up — see `dashboard/layout.tsx`). A client component (needs
 * `usePathname` for active-link state) so the Fan/Artist split — real
 * server-side gating in `dashboard/(artist)/layout.tsx` — is also visible,
 * not just enforced silently.
 */
export function DashboardNav({
  role,
  demoModeEnabled,
  variant = 'topbar',
}: {
  role: UserRole;
  demoModeEnabled: boolean;
  variant?: 'topbar' | 'sidebar';
}) {
  const pathname = usePathname();
  const balance = trpc.amps.myBalance.useQuery(undefined, { enabled: role !== 'FAN' });
  const links = navLinksForRole(role);
  const isPro = (balance.data?.unlockedThemes.length ?? 0) > 0;

  function isActive(href: string): boolean {
    return href === '/dashboard' ? pathname === '/dashboard' : (pathname?.startsWith(href) ?? false);
  }

  const planBadge =
    role !== 'FAN' ? (
      <Link href="/dashboard/upgrade">
        <Badge tone={isPro ? 'brand' : 'neutral'} className="cursor-pointer">
          {isPro ? 'Pro' : 'Free plan'}
        </Badge>
      </Link>
    ) : null;

  const personaSwitcher =
    demoModeEnabled && (role === 'ARTIST' || role === 'FAN') ? (
      <div
        className="flex items-center gap-0.5 rounded-full border border-white/8 bg-white/5 p-0.5"
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
              role === 'ARTIST' ? 'bg-brand-500/20 text-brand-400' : 'text-ink-faint hover:text-ink',
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
              role === 'FAN' ? 'bg-brand-500/20 text-brand-400' : 'text-ink-faint hover:text-ink',
            )}
          >
            Fan
          </button>
        </form>
      </div>
    ) : (
      <Badge tone="neutral">{role === 'FAN' ? 'Fan' : 'Artist'}</Badge>
    );

  if (variant === 'sidebar') {
    return (
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href as never}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                active ? 'bg-white/8 font-medium text-ink' : 'text-ink-muted hover:bg-white/5 hover:text-ink',
              )}
            >
              <link.icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          {planBadge}
          {personaSwitcher}
        </div>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {links.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href as never}
            className={cn('text-sm transition-colors', active ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink')}
          >
            {link.label}
          </Link>
        );
      })}
      {planBadge}
      {personaSwitcher}
    </div>
  );
}
