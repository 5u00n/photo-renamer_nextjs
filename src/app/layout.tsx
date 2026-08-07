import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/navbar';
import { verifySession } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PhotoNamer — Student Photo Management',
  description: 'Upload, name, and manage student photos. Built with Next.js App Router and SQLite.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-body antialiased min-h-screen bg-muted/30 flex flex-col`}>
        <Navbar user={session} />
        <div className="flex-1 flex flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
