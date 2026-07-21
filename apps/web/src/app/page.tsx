import Link from 'next/link';
import { Link2, HeartHandshake, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@amplifyworld/ui';

const features = [
  {
    icon: Link2,
    title: 'One link, everything',
    description: 'Streaming, merch, tickets, and socials — all in one page you fully own.',
  },
  {
    icon: HeartHandshake,
    title: 'Direct fan support',
    description: 'Tips, gated drops, and exclusive content, built for direct fan relationships.',
  },
  {
    icon: BarChart3,
    title: 'Built to grow',
    description: 'New block types and integrations ship without touching what already works.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <nav className="flex items-center justify-between py-8">
        <span className="text-sm font-semibold tracking-tight">AmplifyWorld Link</span>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </Link>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-20 text-center">
        <div className="animate-fade-up rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/60">
          Built for independent artists
        </div>

        <h1
          className="text-gradient max-w-2xl animate-fade-up text-5xl font-semibold tracking-tight sm:text-6xl"
          style={{ animationDelay: '80ms' }}
        >
          Every way a fan can support you, one link.
        </h1>

        <p
          className="max-w-lg animate-fade-up text-balance text-white/60"
          style={{ animationDelay: '150ms' }}
        >
          A page you own, that grows with you — links, media, tips, and gated content,
          without giving up your direct relationship with fans.
        </p>

        <div className="flex animate-fade-up items-center gap-3" style={{ animationDelay: '220ms' }}>
          <Link href="/dashboard">
            <Button size="lg" icon={<ArrowRight className="size-4" />} className="flex-row-reverse">
              Get started
            </Button>
          </Link>
          <Link href="/demo-artist">
            <Button variant="outline" size="lg">
              See an example
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid animate-fade-up gap-4 pb-24 sm:grid-cols-3" style={{ animationDelay: '280ms' }}>
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left"
          >
            <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <feature.icon className="size-4" />
            </span>
            <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
