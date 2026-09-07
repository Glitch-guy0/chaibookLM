'use client';

interface FloatingBackButtonProps {
  onClick: () => void;
}

/**
 * Sticky Floating Neo-Brutalist Action Button (Story 4.5: AC-4.5.3 & AC-4.5.4)
 * Docks at bottom center on mobile viewports when inspecting Showcase proof,
 * allowing instant return to Chat tab while restoring previous scroll offset.
 * Minimum touch target: 48px height x 140px width (≥ 44px).
 */
export function FloatingBackButton({ onClick }: FloatingBackButtonProps) {
  return (
    <button
      type="button"
      data-debug="FloatingBackButton"
      data-testid="floating-back-button"
      data-od-id="floating-back-button"
      onClick={onClick}
      aria-label="Back to Chat"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex min-h-[48px] min-w-[148px] items-center justify-center gap-2 rounded-sm border-2 border-border dark:border-border-dark bg-[#FFE500] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-ink shadow-[4px_4px_0_0_#111111] hover:translate-x-[-50%] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#111111] active:translate-x-[-50%] active:translate-y-[2px] active:shadow-none focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 transition-all cursor-pointer"
    >
      <span>←</span>
      <span>Back to Chat</span>
    </button>
  );
}
