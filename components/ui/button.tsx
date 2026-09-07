'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  'data-testid'?: string;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'chai-button-primary bg-[var(--accent,#FFE500)] text-[var(--fg,#111111)] dark:bg-[var(--accent,#FACC15)] dark:text-[var(--fg,#111111)] ',
  secondary:
    'bg-[var(--surface,#FFFFFF)] text-[var(--fg,#111111)] dark:bg-[var(--surface,#18181B)] dark:text-[var(--fg,#FFFFFF)] ',
  danger:
    'bg-[var(--danger,#FF3333)] text-white dark:bg-[var(--danger,#FF3333)] dark:text-white ',
  ghost:
    'bg-transparent text-[var(--fg,#111111)] dark:text-[var(--fg,#FFFFFF)] hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 ',
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs ',
  md: 'px-5 py-2.5 text-sm ',
  lg: 'px-7 py-3.5 text-base ',
};

export const buttonBaseClasses =
  'chai-button relative inline-flex items-center justify-center gap-2 ' +
  'font-bold font-mono uppercase tracking-wider ' +
  'border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)] ' +
  'rounded-[2px] ' +
  'cursor-pointer select-none ' +
  'transition-[transform,box-shadow,background] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ' +
  // Tactile elevation flow: 4px 4px default
  'shadow-[4px_4px_0_0_var(--border,#111111)] ' +
  'dark:shadow-[4px_4px_0_0_var(--border-dark,#E4E4E7)] ' +
  // Hover: 6px 6px shadow with translate(-2px, -2px)
  'hover:shadow-[6px_6px_0_0_var(--border,#111111)] ' +
  'dark:hover:shadow-[6px_6px_0_0_var(--border-dark,#E4E4E7)] ' +
  'hover:-translate-x-[2px] hover:-translate-y-[2px] ' +
  // Active/press: 0 0 0 0 shadow with translate(4px, 4px) in 0.06s ease
  'active:shadow-none ' +
  'active:translate-x-[4px] active:translate-y-[4px] ' +
  'active:duration-75 ' +
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
      size = 'md',
      className = '',
      children,
      'data-testid': testId = 'button',
      ...props
    },
    ref,
  ) => {
    const classNames = `${buttonBaseClasses} ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={classNames}
        data-testid={testId}
        {...props}
      >
        <span className="chai-button-label inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';