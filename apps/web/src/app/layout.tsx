import type { Metadata } from 'next';
import { TRPCProviders } from '../lib/trpc/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AmplifyWorld Link',
  description: 'One page for every way a fan can support an artist.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <TRPCProviders>{children}</TRPCProviders>
      </body>
    </html>
  );
}
