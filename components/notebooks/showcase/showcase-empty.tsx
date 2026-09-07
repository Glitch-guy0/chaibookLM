'use client';

/**
 * Empty state for Showcase pane when no citation is currently active.
 * AC-4.1.1: Displays "Click any citation pill in chat to verify proof in the original source."
 */
export function ShowcaseEmpty() {
  return (
    <div
      data-debug="ShowcaseEmpty"
      data-testid="showcase-empty"
      data-od-id="showcase-empty"
      className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center border-2 border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-default shadow-[3px_3px_0_0_#111111]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark shadow-[2px_2px_0_0_#111111]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink dark:text-ink-dark"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
      </div>
      <p className="max-w-xs font-mono text-sm font-semibold text-ink dark:text-ink-dark">
        Click any citation pill in chat to verify proof in the original source.
      </p>
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
        Original PDF pages, YouTube dialogue, web pages, and notes render here.
      </p>
    </div>
  );
}
