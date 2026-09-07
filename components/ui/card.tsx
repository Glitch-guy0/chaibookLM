import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Neo-brutalist card:
 * - Surface fill, 2px ink border, 4px/5px offset shadow
 */
export function Card({
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--surface,#FFFFFF)] dark:bg-[var(--surface,#18181B)]',
        'border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)]',
        'shadow-[4px_4px_0_0_var(--border,#111111)]',
        'dark:shadow-[4px_4px_0_0_var(--border-dark,#E4E4E7)]',
        'p-4',
        'rounded-[2px]',
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