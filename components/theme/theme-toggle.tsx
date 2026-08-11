'use client';

import { useTheme } from './theme-context';

/**
 * Manual theme override control. Mounted in the dashboard header today —
 * the only persistent chrome surface in the app.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      data-debug="ThemeToggle"
      className={
        'inline-flex h-9 w-9 items-center justify-center ' +
        'border-2 border-border dark:border-border-dark ' +
        'bg-surface-elevated dark:bg-surface-elevated-dark ' +
        'text-ink dark:text-ink-dark ' +
        'cursor-pointer select-none ' +
        'transition-colors duration-150 ease-in-out ' +
        'hover:bg-surface dark:hover:bg-surface-dark ' +
        'focus-visible:outline-3 focus-visible:outline-focus-ring dark:focus-visible:outline-focus-ring-dark focus-visible:outline-offset-2'
      }
    >
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </button>
  );
}
