'use client';

import React from 'react';

export interface RefusalCardProps {
  credits?: number;
  status?: 'idle' | 'pending' | 'done' | 'failed';
  addedCount?: number;
  errorMessage?: string;
  onSearchWebAndAnswer: () => void;
}

/**
 * Story 3.4: Grounded Boundary Detection, Honest Refusal & Tavily Web Search Fallback.
 * Renders an inline warning card with honest refusal notice and an approval-gated
 * action card offering Tavily live web search, consuming 1 credit.
 */
export function RefusalCard({
  credits = 10,
  status = 'idle',
  addedCount,
  errorMessage,
  onSearchWebAndAnswer,
}: RefusalCardProps) {
  const isZeroCredits = credits <= 0;
  const isPending = status === 'pending';

  return (
    <div
      data-testid="refusal-card"
      className="refusal my-3 p-4 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark rounded-[2px] shadow-[4px_4px_0_0_var(--border)]"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none select-none" aria-hidden="true">
          ⚠️
        </span>
        <div className="space-y-1.5 flex-1">
          <div className="rtitle font-mono font-bold text-xs uppercase tracking-wider text-ink dark:text-ink-dark">
            ⚠ Honest refusal
          </div>
          <p className="font-mono font-bold text-xs text-ink dark:text-ink-dark">
            The uploaded sources do not specify the requested information.
          </p>
          <p className="text-xs text-muted font-sans leading-relaxed">
            The assistant is strictly grounded to your uploaded materials and refuses to speculate.
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-dashed border-border dark:border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono font-bold text-ink dark:text-ink-dark">
              Search the live web via Tavily? (Consumes 1 credit)
            </p>
            {isZeroCredits && (
              <p className="text-[11px] font-mono text-danger mt-0.5" data-testid="credit-reset-notice">
                0 credits remaining. Web search disabled until midnight reset.
              </p>
            )}
            {status === 'failed' && (
              <p className="text-[11px] font-mono text-danger mt-0.5">
                {errorMessage || 'Web search failed. Please try again.'}
              </p>
            )}
            {status === 'done' && (
              <p className="text-[11px] font-mono text-[var(--success,#00E575)] font-bold mt-0.5">
                Added {addedCount ?? 3} web sources to notebook.
              </p>
            )}
            <div className="cost text-[10px] font-mono text-muted mt-1">
              Consumes 1 credit · Tavily search fallback
            </div>
          </div>

          <button
            type="button"
            data-testid="search-web-button"
            onClick={onSearchWebAndAnswer}
            disabled={isZeroCredits || isPending || status === 'done'}
            className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold font-mono uppercase tracking-wider bg-[var(--accent,#FFE500)] text-[#111111] border-2 border-border dark:border-border-dark rounded-[2px] shadow-[3px_3px_0_0_var(--border)] hover:shadow-[4px_4px_0_0_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--citation)] focus-visible:outline-offset-2"
          >
            {isPending ? (
              <span>Searching the web via Tavily…</span>
            ) : (
              <span>Search Web &amp; Answer</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
