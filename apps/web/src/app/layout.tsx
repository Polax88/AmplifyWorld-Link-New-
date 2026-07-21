import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { TRPCProviders } from '../lib/trpc/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AmplifyWorld Link',
  description: 'One page for every way a fan can support an artist.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans text-white antialiased selection:bg-brand/30">
        <TRPCProviders>{children}</TRPCProviders>
      </body>
    </html>
  );
}
