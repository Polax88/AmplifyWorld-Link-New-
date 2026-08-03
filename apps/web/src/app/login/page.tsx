import Link from 'next/link';
import { KeyRound, Sparkles, Coins } from 'lucide-react';
import { Button, Card, Logo } from '@amplifyworld/ui';
import { signIn } from '../../server/auth';
import { startDemoSession, startDemoFanSession } from '../../server/services/demo/start-demo-session';
import { env, isDemoMode } from '../../env';

export default function LoginPage() {
  const demoModeEnabled = isDemoMode;
  const spotifyConfigured = Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo height={24} />
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
        <KeyRound className="size-5" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-white/60">Sign in to manage your AmplifyWorld Link pages.</p>
      </div>

      {demoModeEnabled ? (
        <form className="flex w-full flex-col gap-3" action={startDemoSession}>
          <Button type="submit" size="lg" icon={<Sparkles className="size-4" />} className="w-full">
            Continue as Demo Artist
          </Button>
          <p className="text-xs text-white/40">
            Instantly get your own sandbox artist — a live AMI score, connected socials, smart links, and fan
            data — no real account needed.
          </p>
        </form>
      ) : null}

      {demoModeEnabled ? (
        <form className="flex w-full flex-col gap-3" action={startDemoFanSession}>
          <Button type="submit" variant="outline" size="lg" icon={<Coins className="size-4" />} className="w-full">
            Continue as Demo Fan
          </Button>
          <p className="text-xs text-white/40">
            Just here for Predictions? Get 1,000 $AMPS (fictional points, no real money) to bet on which artists,
            genres, and countries will break out next.
          </p>
        </form>
      ) : null}

      {spotifyConfigured ? (
        <form
          className="w-full"
          action={async () => {
            'use server';
            await signIn('spotify', { redirectTo: '/dashboard' });
          }}
        >
          <Button type="submit" variant={demoModeEnabled ? 'outline' : 'primary'} size="lg" className="w-full">
            Continue with Spotify
          </Button>
        </form>
      ) : null}

      {!demoModeEnabled && !spotifyConfigured ? (
        <Card className="w-full text-left text-sm text-white/60">
          No auth provider is configured yet. Add one (Google, Spotify, Discord, ...) in{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">apps/web/src/server/auth.ts</code>.
        </Card>
      ) : null}

      <Link href="/" className="text-xs text-white/40 hover:text-white/70">
        Back home
      </Link>
    </main>
  );
}
