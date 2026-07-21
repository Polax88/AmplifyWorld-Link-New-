import Link from 'next/link';
import { Button } from '@amplifyworld/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold">AmplifyWorld Link</h1>
      <p className="text-white/70">
        One page for every way a fan can support an artist — links, socials, media, and more.
      </p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </main>
  );
}
