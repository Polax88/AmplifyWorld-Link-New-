import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Avatar } from '@amplifyworld/ui';
import { auth } from '../../server/auth';
import { featureFlags } from '../../server/services/feature-flags';
import { DashboardProvider } from '../../components/DashboardContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const aiWizardEnabled = await featureFlags.isEnabled('ai-onboarding-wizard', session.user.id);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            AmplifyWorld Link
          </Link>
          <Avatar name={session.user.name ?? session.user.email ?? 'You'} size="sm" />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <DashboardProvider aiWizardEnabled={aiWizardEnabled}>{children}</DashboardProvider>
      </div>
    </div>
  );
}
