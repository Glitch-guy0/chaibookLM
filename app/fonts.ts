import { Archivo_Black, Space_Grotesk, Space_Mono } from 'next/font/google';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

/**
 * CSS variable class string for use on the root <html> element.
 * Example: <html className={fonts}>
 */
export const fonts = `${archivoBlack.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`;