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
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-canvas/70 backdrop-blur-md">
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
      <div className="mx-auto max-w-3xl px-6 py-10">
        <DashboardProvider
          aiWizardEnabled={aiWizardEnabled}
          viberateEnabled={viberateEnabled}
          demoModeEnabled={isDemoMode}
        >
          {children}
        </DashboardProvider>
      </div>
    </div>
  );
}
