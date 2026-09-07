import { Inter, Space_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const spaceMonoDisplay = Space_Mono({
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

/**
 * CSS variable class string for use on the root <html> element.
 * Example: <html className={fonts}>
 */
export const fonts = `${inter.variable} ${spaceMono.variable} ${spaceMonoDisplay.variable}`;