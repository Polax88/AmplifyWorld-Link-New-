import { notFound } from 'next/navigation';
import { auth } from '../../../../../server/auth';
import { ApiKeyManager } from '../../../../../components/ApiKeyManager';

/**
 * Admin-only management of read-only external Artist Momentum Index API
 * keys — issued manually per partner (label, e.g. "Sony Music — Q3
 * partnership"), no self-serve signup or billing yet.
 */
export default async function AdminApiKeysPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold leading-tight">API keys</h1>
        <p className="mt-1 text-sm text-white/50">
          Read-only access to the Artist Momentum Index API for labels, promoters, brands, and data partners.
        </p>
      </div>
      <ApiKeyManager />
    </div>
  );
}
