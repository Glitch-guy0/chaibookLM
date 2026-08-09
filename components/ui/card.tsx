import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  'data-debug'?: string;
}

/**
 * Neo-brutalist card:
 * - White fill, 2px ink border, 3px offset shadow
 * - Not slanted
 */
export function Card({
  children,
  className = '',
  'data-debug': debugName = 'Card',
  ...props
}: CardProps) {
  return (
    <div
      data-debug={debugName}
      className={[
        'bg-surface-elevated dark:bg-surface-elevated-dark',
        'border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)]',
        'shadow-[3px_3px_0_0_var(--color-ink)]',
        'dark:shadow-[3px_3px_0_0_var(--color-ink-dark)]',
        'p-4',
        'rounded-[var(--radius-default)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}