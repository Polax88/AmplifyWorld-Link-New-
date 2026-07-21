import { redirect } from 'next/navigation';
import { auth } from '../../server/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <span className="font-semibold">AmplifyWorld Link</span>
        <span className="text-sm text-white/60">{session.user.email}</span>
      </header>
      {children}
    </div>
  );
}
