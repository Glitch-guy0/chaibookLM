import Link from 'next/link';
import { Button } from '@components/ui/button';

/**
 * Landing hero — product name, live status badge, tagline, primary CTA to /sign-in,
 * and interactive mini-workspace demo strip (based on mockup-landing.html).
 */
export function LandingHero() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
      {/* Eyebrow with pulsing live status dot */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span
          className="h-2.5 w-2.5 rounded-full bg-[var(--success,#00E575)] shadow-[0_0_0_4px_rgba(0,229,117,0.3)] animate-pulse"
          aria-hidden="true"
        />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted">
          Grounded Research Workspace
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="max-w-4xl font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink dark:text-ink-dark leading-[1.15]">
        Ask your sources.{' '}
        <span className="inline-block bg-[var(--accent,#FFE500)] text-[#111111] px-3 py-1 mt-1 border-2 border-border shadow-[4px_4px_0_0_var(--border,#111111)]">
          Verify every answer.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 max-w-2xl font-sans text-base sm:text-lg text-ink-secondary dark:text-ink-secondary-dark leading-relaxed">
        Drop in PDFs, web pages, transcripts, and YouTube videos. Ask anything and
        get answers with inline citations you can trace back to the original
        source — a highlighted passage, page, or timestamp.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/sign-in">
          <Button variant="primary" size="lg" data-testid="landing-hero-cta">
            Get started →
          </Button>
        </Link>
        <a href="#how" className="no-underline">
          <Button variant="secondary" size="lg">
            See how it works
          </Button>
        </a>
      </div>

      {/* Trust & Policy Note */}
      <p className="mt-4 font-mono text-xs text-muted">
        Free tier · 10 credits/day · Midnight IST ephemeral reset
      </p>

      {/* Mini Workspace Preview (from mockup-landing.html) */}
      <div className="mt-12 w-full max-w-4xl border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-[10px_10px_0_0_var(--border,#111111)] dark:shadow-[10px_10px_0_0_var(--border-dark,#E4E4E7)] overflow-hidden text-left">
        {/* Strip Header with diagonal texture */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-border dark:border-border-dark bg-surface pattern-diagonal font-mono text-xs font-bold text-muted">
          <span className="flex items-center gap-2 text-ink dark:text-ink-dark">
            <span className="inline-block h-3.5 w-3.5 border-2 border-border bg-accent" />
            CONTEXTUAL WORKSPACE
          </span>
          <span className="text-[11px]">contextual / consensus-protocols</span>
        </div>

        {/* 3-Pane Mini Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_280px] min-h-[260px] text-xs">
          {/* Pane 1: Sources */}
          <div className="border-b md:border-b-0 md:border-r-2 border-border dark:border-border-dark p-3 flex flex-col gap-2 bg-surface">
            <div className="font-mono font-bold text-[11px] text-muted uppercase tracking-wider pb-1 border-b border-border/40">
              SOURCES (3/10)
            </div>
            <div className="flex items-center gap-2 p-2 border-2 border-border dark:border-border-dark bg-surface shadow-[2px_2px_0_0_var(--border,#111111)] font-mono text-[11px]">
              <span className="dot green" />
              <span className="truncate">raft-paper.pdf</span>
            </div>
            <div className="flex items-center gap-2 p-2 border-2 border-border dark:border-border-dark bg-surface shadow-[2px_2px_0_0_var(--border,#111111)] font-mono text-[11px]">
              <span className="dot yellow animate-pulse" />
              <span className="truncate">mit-distributed-systems.yt</span>
            </div>
            <div className="flex items-center gap-2 p-2 border-2 border-border dark:border-border-dark bg-surface shadow-[2px_2px_0_0_var(--border,#111111)] font-mono text-[11px]">
              <span className="dot green" />
              <span className="truncate">paxos-vs-raft.web</span>
            </div>
          </div>

          {/* Pane 2: Chat */}
          <div className="border-b md:border-b-0 md:border-r-2 border-border dark:border-border-dark p-4 flex flex-col gap-3 bg-surface">
            {/* User message */}
            <div className="self-start max-w-[90%] border-2 border-border bg-accent text-[#111111] font-mono text-xs p-2.5 shadow-[3px_3px_0_0_var(--border,#111111)]">
              How does Raft maintain log safety during leader election?
            </div>
            {/* Assistant answer */}
            <div className="font-sans text-xs text-ink dark:text-ink-dark leading-relaxed">
              A candidate must contain all committed entries in its log to win an
              election. When requesting votes, it transmits its log index and term;
              voters deny their vote if their own log is more up-to-date{' '}
              <span className="pill">
                [1]
              </span>
              .
            </div>
          </div>

          {/* Pane 3: Showcase */}
          <div className="p-3 flex flex-col gap-2 bg-surface">
            <div className="font-mono font-bold text-[11px] text-muted uppercase tracking-wider pb-1 border-b border-border/40">
              ORIGINAL VIEW · PAGE 8
            </div>
            <div className="p-2.5 border-2 border-border dark:border-border-dark bg-surface shadow-[2px_2px_0_0_var(--border,#111111)] font-mono text-[11px] leading-relaxed">
              <span className="bg-citation/40 px-1 py-0.5 border border-citation text-ink dark:text-ink-dark font-semibold">
                §5.4.1 Election restriction: Raft determines which of two logs is
                more up-to-date by comparing the index and term of the last
                entries.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
