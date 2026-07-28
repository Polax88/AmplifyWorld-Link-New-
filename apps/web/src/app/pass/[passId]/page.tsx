import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Wallet } from 'lucide-react';
import { prisma } from '@amplifyworld/database';
import { Avatar, Card, Badge, Button, QrCode, Logo } from '@amplifyworld/ui';

export const dynamic = 'force-dynamic';

/**
 * Public, unauthenticated pass page — the first sibling to `/[handle]`.
 * Fanwallet-UX-inspired but entirely local/mocked: no real Google/Apple
 * Wallet integration, no real dependency on the separate fanwallet product.
 * The QR code encodes this exact page's own URL (same "the share URL is
 * the join URL" idea `ShareQrButton` already uses for the artist page).
 */
export default async function PublicPassPage({ params }: { params: Promise<{ passId: string }> }) {
  const { passId } = await params;

  const pass = await prisma.pass.findUnique({
    where: { id: passId },
    include: { page: { select: { title: true, handle: true, status: true } } },
  });

  if (!pass || pass.page.status !== 'PUBLISHED') {
    notFound();
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pass/${passId}`;

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-8 px-6 py-16 sm:py-20"
      style={{ '--theme-accent': pass.accentColor } as CSSProperties}
    >
      <Card className="w-full gap-5 overflow-hidden">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute size-28 rounded-full opacity-40 blur-3xl"
              style={{ background: 'var(--theme-accent)' }}
            />
            <Avatar src={pass.imageUrl} name={pass.name} size="xl" ring className="relative" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{pass.name}</h1>
            <Link href={`/${pass.page.handle}` as never} className="text-sm text-white/50 hover:text-white/70">
              {pass.page.title}
            </Link>
          </div>
        </div>

        {pass.eventName || pass.eventDate || pass.eventVenue ? (
          <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            {pass.eventName ? <p className="text-sm font-medium">{pass.eventName}</p> : null}
            {pass.eventDate ? (
              <p className="flex items-center gap-1.5 text-xs text-white/60">
                <Calendar className="size-3.5" />
                {new Date(pass.eventDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            ) : null}
            {pass.eventVenue ? (
              <p className="flex items-center gap-1.5 text-xs text-white/60">
                <MapPin className="size-3.5" />
                {pass.eventVenue}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-center">
          <QrCode value={url} size={180} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" size="lg" icon={<Wallet className="size-4" />} disabled className="w-full">
            Add to Wallet
          </Button>
          <Badge tone="neutral">Demo only — no real wallet integration</Badge>
        </div>
      </Card>

      <footer className="flex items-center gap-1.5 text-xs text-white/30">
        Powered by <Logo height={12} className="opacity-60" />
      </footer>
    </main>
  );
}
