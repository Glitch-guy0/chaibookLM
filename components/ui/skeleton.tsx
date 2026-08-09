import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes for custom width, height, etc. */
  className?: string;
}

/**
 * Animated pulse placeholder used for cold-load / loading states.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      data-debug="Skeleton"
      className={[
        'animate-pulse rounded-[var(--radius-md)]',
        'bg-[var(--color-ink-muted)] dark:bg-[var(--color-ink-muted-dark)]',
        'opacity-30 dark:opacity-20',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}