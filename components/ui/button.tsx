'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  'data-debug'?: string;
  'data-testid'?: string;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'chai-button-primary bg-[var(--accent,#FFE500)] text-[var(--color-ink,#111111)] dark:bg-[var(--accent,#FACC15)] dark:text-[var(--color-ink,#111111)] ',
  secondary:
    'bg-[var(--surface,#FFFFFF)] text-[var(--color-ink,#111111)] dark:bg-[var(--surface,#18181B)] dark:text-[var(--color-ink-dark,#FFFFFF)] ',
  danger:
    'bg-[var(--danger,#FF3333)] text-white dark:bg-[var(--danger,#FF3333)] dark:text-white ',
  ghost:
    'bg-transparent text-[var(--color-ink,#111111)] dark:text-[var(--color-ink-dark,#FFFFFF)] shadow-none hover:shadow-none active:shadow-none ',
};

export const buttonBaseClasses =
  'chai-button relative inline-flex items-center justify-center gap-2 px-6 py-3 ' +
  'text-sm font-semibold font-mono uppercase tracking-wider ' +
  'border-2 border-[var(--color-border,#111111)] dark:border-[var(--color-border-dark,#E4E4E7)] ' +
  'rounded-[var(--radius-default,0px)] ' +
  'cursor-pointer select-none ' +
  'transition-all duration-150 ease-in-out ' +
  '[transform:skewX(-6deg)] group ' +
  // Tactile elevation flow: 4px 4px default
  'shadow-[4px_4px_0_0_var(--color-border,#111111)] ' +
  'dark:shadow-[4px_4px_0_0_var(--color-border-dark,#E4E4E7)] ' +
  // Hover: 6px 6px shadow with translate(-2px, -2px)
  'hover:[transform:skewX(-10deg)] ' +
  'hover:shadow-[6px_6px_0_0_var(--color-border,#111111)] ' +
  'dark:hover:shadow-[6px_6px_0_0_var(--color-border-dark,#E4E4E7)] ' +
  'hover:-translate-x-[2px] hover:-translate-y-[2px] ' +
  // Active/press: 0 0 0 0 shadow with translate(4px, 4px)
  'active:[transform:skewX(-6deg)] ' +
  'active:shadow-none ' +
  'active:translate-x-[4px] active:translate-y-[4px] ' +
  // Motion reduction: disable transforms and shift bottom border by 3px (2px -> 5px)
  'motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:active:transform-none ' +
  'motion-reduce:hover:border-b-[5px] motion-reduce:border-b-[5px] ' +
  // Focus ring
  'focus-visible:outline-3 focus-visible:outline-[var(--citation,#00E5FF)] focus-visible:outline-offset-2 ' +
  // Disabled
  'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:transform-none';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      className = '',
      children,
      'data-debug': debugName,
      'data-testid': testId = 'button',
      ...props
    },
    ref,
  ) => {
    const classNames = `${buttonBaseClasses} ${buttonVariantClasses[variant]} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={classNames}
        data-testid={testId}
        data-debug={debugName ?? 'Button'}
        {...props}
      >
        <span className="chai-button-label inline-block [transform:skewX(6deg)] group-hover:[transform:skewX(10deg)] group-active:[transform:skewX(6deg)] transition-transform duration-150 ease-in-out motion-reduce:transform-none motion-reduce:group-hover:transform-none motion-reduce:group-active:transform-none">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';