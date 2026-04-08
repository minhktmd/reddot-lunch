import { Analytics } from '@vercel/analytics/react';

import { AppProviders } from './providers';

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cơm trưa Reddotlabs',
  description: 'Đặt cơm trưa văn phòng Reddotlabs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
