import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar, Badge, Logo } from '@amplifyworld/ui';
import { auth } from '../../server/auth';
import { featureFlags } from '../../server/services/feature-flags';
import { DashboardProvider } from '../../components/DashboardContext';
import { DashboardNav } from '../../components/DashboardNav';
import { NotificationBell } from '../../components/NotificationBell';
import { isDemoMode } from '../../env';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const aiWizardEnabled = await featureFlags.isEnabled('ai-onboarding-wizard', session.user.id);
  const viberateEnabled = await featureFlags.isEnabled('viberate-integration', session.user.id);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar (lg+) — a persistent left nav reads as a professional
          tool rather than the single mobile-style top bar below, which stays
          the only chrome under lg. */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/8 lg:bg-surface/40 lg:px-4 lg:py-6">
        <Link href="/dashboard" aria-label="AmplifyWorld Link home" className="flex items-center gap-2 px-2">
          <Logo height={20} />
        </Link>
        {isDemoMode ? (
          <Badge tone="brand" className="mt-3 w-fit">
            Demo Mode
          </Badge>
        ) : null}
        <div className="mt-8 flex flex-1 flex-col">
          <DashboardNav role={session.user.role} demoModeEnabled={isDemoMode} variant="sidebar" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/8 pt-4">
          <Avatar name={session.user.name ?? session.user.email ?? 'You'} size="sm" />
          {session.user.role !== 'FAN' ? <NotificationBell /> : null}
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-canvas/70 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" aria-label="AmplifyWorld Link home">
                <Logo height={20} />
              </Link>
              {isDemoMode ? <Badge tone="brand">Demo Mode</Badge> : null}
            </div>
            <div className="flex items-center gap-4">
              <DashboardNav role={session.user.role} demoModeEnabled={isDemoMode} />
              {session.user.role !== 'FAN' ? <NotificationBell /> : null}
              <Avatar name={session.user.name ?? session.user.email ?? 'You'} size="sm" />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-10 lg:max-w-4xl">
          <DashboardProvider
            aiWizardEnabled={aiWizardEnabled}
            viberateEnabled={viberateEnabled}
            demoModeEnabled={isDemoMode}
          >
            {children}
          </DashboardProvider>
        </div>
      </div>
    </div>
  );
}
