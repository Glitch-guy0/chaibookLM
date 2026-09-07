import Link from 'next/link';
import { LandingHero } from '@components/landing/landing-hero';
import { LandingStory } from '@components/landing/landing-story';
import { LandingCta } from '@components/landing/landing-cta';
import { ThemeToggle } from '@components/theme/theme-toggle';
import { Button } from '@components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b-2 border-border dark:border-border-dark bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-base font-bold tracking-tight text-ink dark:text-ink-dark no-underline"
          >
            <span
              className="inline-grid place-items-center h-7 w-7 border-2 border-border dark:border-border-dark bg-accent text-ink shadow-[2px_2px_0_0_var(--border,#111111)]"
              aria-hidden="true"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="2" />
                <path d="M5 8h6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            CONTEXTUAL
          </Link>

          <nav className="hidden sm:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider text-muted">
            <a href="#how" className="hover:text-ink dark:hover:text-ink-dark transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-ink dark:hover:text-ink-dark transition-colors">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 scroll-smooth">
        <LandingHero />
        <LandingStory />
        <LandingCta />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink dark:text-ink-dark">CONTEXTUAL</span>
            <span>— Precision-engineered research workspace</span>
          </div>
          <div>All queries strictly grounded. Ephemeral auto-purge at midnight IST.</div>
        </div>
      </footer>
    </div>
  );
}

