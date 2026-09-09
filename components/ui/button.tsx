'use client';

import { forwardRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type FocusEvent } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  'data-testid'?: string;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'chai-button-primary bg-[var(--accent,#FFE500)] text-[var(--fg,#111111)] dark:bg-[var(--accent,#FACC15)] dark:text-[var(--fg,#111111)] focus-visible:outline-[var(--color-surface,#FFFFFF)] dark:focus-visible:outline-[var(--color-surface-dark,#0D0D0D)] ',
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
  'active:shadow-none hover:active:shadow-none dark:active:shadow-none dark:hover:active:shadow-none ' +
  'active:translate-x-[4px] active:translate-y-[4px] ' +
  'active:duration-75 ' +
  // Motion reduction: disable transforms and shift bottom border by 3px on hover only (2px -> 5px)
  'motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:active:transform-none ' +
  'motion-reduce:hover:border-b-[5px] ' +
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
      onKeyDown,
      onKeyUp,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
        setIsPressed(true);
      }
      onKeyDown?.(e);
    };

    const handleKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsPressed(false);
      }
      onKeyUp?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      onBlur?.(e);
    };

    const pressedClasses = isPressed
      ? 'translate-x-[4px] translate-y-[4px] !shadow-none '
      : '';

    const classNames = `${buttonBaseClasses} ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${pressedClasses} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={classNames}
        data-testid={testId}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
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