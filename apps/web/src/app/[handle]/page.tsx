import { notFound } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import '../../server/bootstrap';
import { analytics } from '../../server/services/analytics';
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

  await analytics.track({ type: 'PAGE_VIEW', pageId: page.id });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-6 py-16">
      {page.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.avatarUrl} alt={page.title} className="h-24 w-24 rounded-full object-cover" />
      ) : null}
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        {page.bio ? <p className="mt-1 text-white/70">{page.bio}</p> : null}
      </div>
      <div className="flex w-full flex-col gap-3">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </main>
  );
}
