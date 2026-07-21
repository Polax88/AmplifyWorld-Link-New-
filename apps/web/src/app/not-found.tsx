import Link from 'next/link';
import { CompassIcon } from 'lucide-react';
import { Button } from '@amplifyworld/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-white/8 text-white/50">
        <CompassIcon className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-white/60">This artist page doesn&apos;t exist or isn&apos;t published yet.</p>
      </div>
      <Link href="/">
        <Button variant="outline" size="sm">
          Back home
        </Button>
      </Link>
    </main>
  );
}
