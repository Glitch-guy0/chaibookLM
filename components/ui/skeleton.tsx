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
      className={[
        'animate-pulse rounded-[2px]',
        'bg-[var(--muted,#555555)]',
        'opacity-25 dark:opacity-20',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}