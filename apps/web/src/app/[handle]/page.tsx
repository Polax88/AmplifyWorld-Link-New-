import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@amplifyworld/database';
import { Avatar, Logo, cn } from '@amplifyworld/ui';
import { getThemePreset, pageThemeSchema } from '@amplifyworld/core';
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

  const theme = pageThemeSchema.parse(page.theme);
  const preset = getThemePreset(theme.themeKey);
  const compact = theme.layout === 'compact';

  return (
    <main
      className={cn(
        'mx-auto flex min-h-screen max-w-md flex-col items-center px-6 sm:py-20',
        compact ? 'gap-5 py-10' : 'gap-8 py-16',
      )}
      style={{ '--theme-accent': preset.accentColor } as CSSProperties}
    >
      <div className="flex animate-fade-up flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute size-28 rounded-full opacity-20 blur-2xl"
            style={{ background: 'var(--theme-accent)' }}
          />
          <Avatar src={page.avatarUrl} name={page.title} size="xl" ring className="relative" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{page.title}</h1>
          {page.bio ? <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted">{page.bio}</p> : null}
        </div>
      </div>

      <div className={cn('flex w-full flex-col', compact ? 'gap-2' : 'gap-3')}>
        {page.blocks.map((block, index) => (
          <div
            key={block.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index, 6) * 60 + 100}ms` }}
          >
            <BlockRenderer block={block} pageHandle={handle} />
          </div>
        ))}
      </div>

      <footer
        className="mt-4 flex animate-fade-up items-center gap-1.5 text-xs text-ink-faint"
        style={{ animationDelay: '400ms' }}
      >
        Powered by <Logo height={12} className="opacity-60" />
      </footer>
    </main>
  );
}
