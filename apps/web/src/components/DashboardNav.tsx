'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, cn } from '@amplifyworld/ui';
import type { UserRole } from '@amplifyworld/database';
import { trpc } from '../lib/trpc/client';

interface NavLink {
  href: string;
  label: string;
}

/**
 * The dashboard header's nav links + persona/plan badges. A client component
 * (needs `usePathname` for active-link state) so the Fan/Artist split — real
 * server-side gating in `dashboard/(artist)/layout.tsx` — is also visible,
 * not just enforced silently.
 */
export function DashboardNav({ role }: { role: UserRole }) {
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
      <Badge tone="neutral">{role === 'FAN' ? 'Fan' : 'Artist'}</Badge>
    </div>
  );
}
