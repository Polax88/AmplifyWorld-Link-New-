export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-white/60">
        No auth provider is configured yet. Add one in{' '}
        <code className="rounded bg-white/10 px-1.5 py-0.5">apps/web/src/server/auth.ts</code>.
      </p>
    </main>
  );
}
