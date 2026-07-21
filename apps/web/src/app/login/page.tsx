import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Card } from '@amplifyworld/ui';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
        <KeyRound className="size-5" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-white/60">Sign in to manage your AmplifyWorld Link pages.</p>
      </div>
      <Card className="w-full text-left text-sm text-white/60">
        No auth provider is configured yet. Add one (Google, Spotify, Discord, ...) in{' '}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">apps/web/src/server/auth.ts</code>.
      </Card>
      <Link href="/" className="text-xs text-white/40 hover:text-white/70">
        Back home
      </Link>
    </main>
  );
}
