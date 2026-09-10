'use client';

import { useTheme } from './theme-context';

/**
 * Neo-Brutalist Theme Toggle button matching mockup-landing.html / component-library.html.
 * Renders crisp SVG sun/moon line icons with 3px -> 5px -> 0px tactile elevation flow.
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
      className={
        'inline-grid place-items-center h-10 w-10 sm:h-9 sm:w-9 ' +
        'border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)] ' +
        'rounded-[2px] bg-[var(--surface,#FFFFFF)] dark:bg-[var(--surface,#18181B)] ' +
        'text-[var(--fg,#111111)] dark:text-[var(--fg,#FFFFFF)] ' +
        'cursor-pointer select-none ' +
        'shadow-[3px_3px_0_0_var(--border,#111111)] dark:shadow-[3px_3px_0_0_var(--border-dark,#E4E4E7)] ' +
        'transition-[transform,box-shadow,background] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ' +
        (isDark
          ? ''
          : 'hover:shadow-[5px_5px_0_0_var(--border,#111111)] dark:hover:shadow-[5px_5px_0_0_var(--border-dark,#E4E4E7)] hover:-translate-x-[1px] hover:-translate-y-[1px] ') +
        'active:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:duration-75 ' +
        'focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2'
      }
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M17 12.5A8 8 0 017.5 3 8 8 0 1017 12.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
