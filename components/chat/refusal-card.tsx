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
      data-debug="RefusalCard"
      className="my-3 p-4 border-2 border-[#FFE500] dark:border-[#FFE500]/80 bg-[#FFFDF0] dark:bg-[#1E1E14] text-ink dark:text-ink-dark rounded shadow-[3px_3px_0_0_#111111]"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none select-none" aria-hidden="true">
          ⚠️
        </span>
        <div className="space-y-1.5 flex-1">
          <p className="font-bold text-sm text-ink dark:text-ink-dark">
            The uploaded sources do not specify the requested information.
          </p>
          <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
            The assistant is strictly grounded to your uploaded materials and refuses to speculate.
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-dashed border-[#FFE500] dark:border-[#FFE500]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink dark:text-ink-dark">
              Search the live web via Tavily? (Consumes 1 credit)
            </p>
            {isZeroCredits && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5" data-testid="credit-reset-notice">
                0 credits remaining. Web search disabled until midnight reset.
              </p>
            )}
            {status === 'failed' && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                {errorMessage || 'Web search failed. Please try again.'}
              </p>
            )}
            {status === 'done' && (
              <p className="text-[11px] text-green-700 dark:text-green-400 font-medium mt-0.5">
                Added {addedCount ?? 3} web sources to notebook.
              </p>
            )}
          </div>

          <button
            type="button"
            data-testid="search-web-button"
            data-debug="SearchWebAndAnswerButton"
            onClick={onSearchWebAndAnswer}
            disabled={isZeroCredits || isPending || status === 'done'}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider bg-[#FFE500] hover:bg-[#FFE500]/90 text-black border-2 border-black rounded shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transform -skew-x-3"
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
