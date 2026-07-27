import { notFound } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import { Avatar, Logo } from '@amplifyworld/ui';
import '../../server/bootstrap';
import { analytics } from '../../server/services/analytics';
import { getRequestSignals } from '../../server/services/request-signals';
import { BlockRenderer } from '../../components/blocks/BlockRenderer';

export const dynamic = 'force-dynamic';

export default async function ArtistPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const page = await prisma.page.findUnique({
    where: { handle },
    include: { blocks: { where: { isEnabled: true }, orderBy: { position: 'asc' } } },
  });

  if (!page || page.status !== 'PUBLISHED') {
    notFound();
  }

  const signals = await getRequestSignals();
  await analytics.track({ type: 'PAGE_VIEW', pageId: page.id, ...signals });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-8 px-6 py-16 sm:py-20">
      <div className="flex animate-fade-up flex-col items-center gap-4 text-center">
        <Avatar src={page.avatarUrl} name={page.title} size="xl" ring />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          {page.bio ? <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/60">{page.bio}</p> : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        {page.blocks.map((block, index) => (
          <div
            key={block.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index, 6) * 60 + 100}ms` }}
          >
            <BlockRenderer block={block} />
          </div>
        ))}
      </div>

      <footer
        className="mt-4 flex animate-fade-up items-center gap-1.5 text-xs text-white/30"
        style={{ animationDelay: '400ms' }}
      >
        Powered by <Logo height={12} className="opacity-60" />
      </footer>
    </main>
  );
}
