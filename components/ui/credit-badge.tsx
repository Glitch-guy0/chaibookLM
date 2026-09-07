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

  let badgeColorClasses = 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark border-border dark:border-border-dark';
  if (isZero) {
    badgeColorClasses = 'bg-[var(--danger,#FF3333)] text-white border-border dark:border-border-dark';
  } else if (isWarning) {
    badgeColorClasses = 'bg-[var(--accent,#FFE500)] text-ink border-border dark:border-border-dark';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        data-testid="credit-badge"
        data-debug="CreditBadge"
        title="View daily credit balance and reset schedule"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-tight border-2 rounded-default cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${badgeColorClasses} ${className}`}
      >
        <span aria-hidden="true">{isZero ? '🔒' : '⚡'}</span>
        <span>
          {credits}/{maxCredits} credits
        </span>
      </button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        title="Daily Query Credits"
        data-debug="CreditDetailsModal"
      >
        <div className="space-y-4 text-sm font-sans text-ink dark:text-ink-dark">
          <div className="p-3 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-default">
            <p className="font-mono text-base font-bold">
              Current Balance:{' '}
              <span className={isZero ? 'text-error' : isWarning ? 'text-warning' : 'text-brand'}>
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
              <li className="font-semibold text-error">
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
