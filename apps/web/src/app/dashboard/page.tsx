import { redirect } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import { auth } from '../../server/auth';
import { featureFlags } from '../../server/services/feature-flags';
import { DashboardPageList } from '../../components/DashboardPageList';

/**
 * Landing route right after login. A brand-new artist should land directly
 * in their hub, not a page-management list — so this redirects straight to
 * `/dashboard/[pageId]` for the common single-page case, and to the
 * onboarding wizard when there's no page yet. The list view (for the small
 * number of artists managing more than one page) stays reachable via
 * `?view=all`, which the hub's back button links to.
 */
export default async function DashboardIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  if (view === 'all') {
    return <DashboardPageList />;
  }

  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Fans have no page at all — send them straight to their actual home
  // instead of falling into the page-lookup/onboarding-wizard logic below.
  if (session.user.role === 'FAN') {
    redirect('/dashboard/predictions');
  }

  const pages = await prisma.page.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (pages.length === 1 && pages[0]) {
    redirect(`/dashboard/${pages[0].id}`);
  }

  if (pages.length === 0) {
    const aiWizardEnabled = await featureFlags.isEnabled('ai-onboarding-wizard', session.user.id);
    if (aiWizardEnabled) {
      redirect('/dashboard/new');
    }
  }

  return <DashboardPageList />;
}
