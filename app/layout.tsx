import type { Metadata } from 'next';
import './globals.css';
import { fonts } from './fonts';
import { Providers } from '@components/providers';

export const metadata: Metadata = {
  title: 'Contextual',
  description: 'Contextual — your AI research notebook (Gemini Notebook clone)',
};

// Runs synchronously in <head>, before <body> renders, so the correct theme
// class is present before first paint (no flash of light UI). Kept as a
// plain string (no external file) so it executes inline and blocking.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var cookies = document.cookie ? document.cookie.split('; ') : [];
    var consent = null;
    var storedTheme = null;
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split('=');
      if (parts[0] === 'cookie-consent') consent = decodeURIComponent(parts.slice(1).join('='));
      if (parts[0] === 'theme') storedTheme = decodeURIComponent(parts.slice(1).join('='));
    }

    var theme = 'light';
    if (consent === 'accepted' && (storedTheme === 'dark' || storedTheme === 'light')) {
      theme = storedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}