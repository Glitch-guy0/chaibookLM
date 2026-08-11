'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  'data-debug'?: string;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'chai-button-primary bg-brand text-[var(--color-ink)] dark:bg-brand dark:text-[var(--color-ink-dark)] ',
  secondary:
    'bg-surface-elevated text-[var(--color-ink)] dark:bg-surface-elevated-dark dark:text-[var(--color-ink-dark)] ',
  danger:
    'bg-error text-white dark:bg-error-dark dark:text-white ',
};

export const buttonBaseClasses =
  'chai-button relative inline-flex items-center justify-center gap-2 px-6 py-3 ' +
  'text-sm font-semibold font-sans uppercase tracking-wider ' +
  'border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] ' +
  'rounded-[var(--radius-default)] ' +
  'cursor-pointer select-none ' +
  'transition-all duration-150 ease-in-out ' +
  // Slant the button
  '[transform:skewX(-6deg)] group ' +
  // Solid shadow – skewed independently to create the brutalist offset
  'shadow-[6px_-6px_0_0_var(--color-ink)] ' +
  'dark:shadow-[6px_-6px_0_0_var(--color-ink-dark)] ' +
  // Hover: deepen slant, stretch shadow
  'hover:[transform:skewX(-10deg)] ' +
  'hover:shadow-[8px_-8px_0_0_var(--color-ink)] ' +
  'dark:hover:shadow-[8px_-8px_0_0_var(--color-ink-dark)] ' +
  // Active/press: collapse shadow, return slant
  'active:[transform:skewX(-6deg)] ' +
  'active:translate-x-[2px] active:translate-y-[-2px] ' +
  'active:shadow-[0px_0px_0_0_var(--color-ink)] ' +
  'dark:active:shadow-[0px_0px_0_0_var(--color-ink-dark)] ' +
  // Focus
  'focus-visible:outline-3 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2 ' +
  // Disabled
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      className = '',
      children,
      'data-debug': debugName,
      ...props
    },
    ref,
  ) => {
    const classNames = `${buttonBaseClasses} ${buttonVariantClasses[variant]} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={classNames}
        data-debug={debugName ?? 'Button'}
        {...props}
      >
        {/* Counter-skew the content so text & icons render upright */}
        <span className="chai-button-label inline-block [transform:skewX(6deg)] group-hover:[transform:skewX(10deg)] group-active:[transform:skewX(6deg)] transition-transform duration-150 ease-in-out">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';