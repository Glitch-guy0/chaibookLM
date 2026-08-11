import type { Metadata } from 'next';
import './globals.css';
import { fonts } from './fonts';
import { Providers } from '@components/providers';

export const metadata: Metadata = {
  title: 'chaibookLM',
  description: 'chaibookLM — your AI research notebook',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}