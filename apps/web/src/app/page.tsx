import Link from 'next/link';
import { Link2, Target, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, Logo, Sparkline } from '@amplifyworld/ui';
import { isDemoMode } from '../env';
import { startDemoPreview } from '../server/services/demo/start-demo-session';

const features = [
  {
    icon: TrendingUp,
    title: 'A score built on real signal',
    description:
      'The Artist Momentum Index weighs reach, engagement, conversion, consistency, and amplification — not vanity metrics — with a confidence indicator showing what’s measured vs. estimated.',
  },
  {
    icon: Link2,
    title: 'Every link, tracked automatically',
    description:
      'UTM tagging and conversion classification (stream, pre-save, ticket, merch, follow) apply the moment you add a link — no manual setup before a launch.',
  },
  {
    icon: Sparkles,
    title: 'Generated in one click',
    description:
      'Enter your name, click once, and get a fully built, on-brand page — pick from 4 templates and customize as much or as little as you want.',
  },
];

const exampleSparkline = [58, 61, 59, 64, 68, 66, 71, 75, 73, 78, 82];
const examplePillars = [
  { label: 'Reach', weight: 25, value: 78 },
  { label: 'Conversion', weight: 20, value: 64 },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <nav className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
          <Logo height={22} />
          {isDemoMode ? <Badge tone="brand">Demo Mode</Badge> : null}
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </Link>
      </nav>

      <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="flex flex-col items-start gap-7">
          <div className="animate-fade-up rounded-full border border-brand-500/25 bg-brand-500/8 px-4 py-1.5 text-xs font-medium text-brand-400">
            For artists, producers &amp; managers
          </div>

          <h1
            className="text-gradient max-w-xl animate-fade-up text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            One link page. Real tracking. Proof of momentum.
          </h1>

          <p className="max-w-lg animate-fade-up text-balance text-ink-muted" style={{ animationDelay: '150ms' }}>
            Generate a professional artist page in one click — every smart link is tracked, every score backed by
            data, so you always know what&apos;s actually working.
          </p>

          <p
            className="animate-fade-up text-xs font-medium uppercase tracking-wide text-ink-faint"
            style={{ animationDelay: '190ms' }}
          >
            Built for independent-to-mid-level artists — no label, no middleman
          </p>

          <div className="flex animate-fade-up items-center gap-3" style={{ animationDelay: '220ms' }}>
            <Link href="/dashboard">
              <Button size="lg" icon={<ArrowRight className="size-4" />} className="flex-row-reverse">
                Generate my page
              </Button>
            </Link>
            {isDemoMode ? (
              <form action={startDemoPreview}>
                <Button type="submit" variant="outline" size="lg" icon={<Target className="size-4" />}>
                  See an example
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        <Card
          className="animate-fade-up gap-4 p-5"
          style={{ animationDelay: '260ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Artist Momentum Index
            </span>
            <Badge tone="neutral">Illustrative</Badge>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-semibold tabular-nums text-ink">82</span>
              <Badge tone="success">+6 this week</Badge>
            </div>
            <Sparkline values={exampleSparkline} width={140} height={44} />
          </div>
          <div className="mt-1 flex flex-col gap-2 border-t border-white/8 pt-4">
            {examplePillars.map((pillar) => (
              <div key={pillar.label} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-ink-muted">
                  {pillar.label}
                  <span className="ml-1.5 text-[10px] text-ink-faint">{pillar.weight}%</span>
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-data-500" style={{ width: `${pillar.value}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums text-ink-muted">{pillar.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid animate-fade-up gap-4 pb-24 sm:grid-cols-3" style={{ animationDelay: '320ms' }}>
        {features.map((feature) => (
          <Card key={feature.title} className="p-6 text-left">
            <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <feature.icon className="size-4" />
            </span>
            <h3 className="text-sm font-semibold text-ink">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
