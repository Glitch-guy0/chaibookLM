'use client';

import { useState } from 'react';
import { Dialog } from './dialog';
import { Button } from './button';

export interface CreditBadgeProps {
  credits?: number;
  maxCredits?: number;
  className?: string;
  onModalToggle?: (isOpen: boolean) => void;
}

export function CreditBadge({
  credits = 10,
  maxCredits = 10,
  className = '',
  onModalToggle,
}: CreditBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    onModalToggle?.(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onModalToggle?.(false);
  };

  const isZero = credits <= 0;
  const isWarning = credits > 0 && credits <= 2;

  let badgeColorClasses = 'bg-surface text-[var(--fg,#111111)] dark:bg-surface-dark dark:text-[var(--fg,#FFFFFF)] border-[var(--border)]';
  if (isZero) {
    badgeColorClasses = 'locked bg-[var(--danger,#FF3333)] text-white border-[var(--border)]';
  } else if (isWarning) {
    badgeColorClasses = 'warn bg-[var(--accent,#FFE500)] text-[var(--fg,#111111)] border-[var(--border)]';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        data-testid="credit-badge"
        title="View daily credit balance and reset schedule"
        className={`credit inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase border-2 rounded-full cursor-pointer select-none transition-[transform,box-shadow,background] duration-150 ease-[cubic-bezier(0.2,0,0,1)] shadow-[3px_3px_0_0_var(--border)] hover:shadow-[5px_5px_0_0_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-3 focus-visible:outline-[var(--citation)] focus-visible:outline-offset-2 ${badgeColorClasses} ${className}`}
      >
        <span aria-hidden="true">{isZero ? '🔒' : '⚡'}</span>
        <span>
          {credits}/{maxCredits} credits
        </span>
      </button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title="⚡ Daily Query Credits"
      >
        <div className="space-y-4 text-sm font-sans text-[var(--fg,#111111)] dark:text-[var(--fg,#FFFFFF)]">
          <div className="p-3 border-2 border-[var(--border,#111111)] dark:border-[var(--border-dark,#E4E4E7)] bg-[var(--surface,#FFFFFF)] dark:bg-[var(--surface,#18181B)] rounded-[2px] shadow-[3px_3px_0_0_var(--border,#111111)]">
            <p className="font-mono text-base font-bold">
              Current Balance:{' '}
              <span className={isZero ? 'text-[var(--danger,#FF3333)]' : isWarning ? 'text-[var(--accent,#FFE500)]' : 'text-[var(--success,#00E575)]'}>
                {credits} of {maxCredits} credits
              </span>
            </p>
          </div>

          <ul className="space-y-2 list-disc list-inside">
            <li>
              Every user receives a daily pool of <strong>{maxCredits} credits</strong>.
            </li>
            <li>
              Each grounded assistant query or web search fallback consumes <strong>1 credit</strong>.
            </li>
            <li>
              Credits automatically reset every midnight at <strong>12:00 AM Asia/Kolkata (18:30 UTC)</strong>.
            </li>
            {isZero && (
              <li className="font-semibold text-[var(--danger,#FF3333)]">
                Your credits are depleted for today. The chat composer is disabled until the midnight reset.
              </li>
            )}
          </ul>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" onClick={handleClose} data-testid="credit-modal-close-btn">
              Got it
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
