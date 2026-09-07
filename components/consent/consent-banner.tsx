'use client';

import { useConsent } from './consent-context';
import { Button } from '../ui/button';

/**
 * First-visit GDPR-style cookie consent banner. Renders only while no
 * consent decision exists yet; dismissible via Accept/Decline only.
 */
export function ConsentBanner() {
  const { consent, accept, decline } = useConsent();

  if (consent !== null) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-4 shadow-[0_-4px_0_0_var(--border,#111111)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-sans text-sm text-ink dark:text-ink-dark">
          We store minimal local cookies related to session, theme, and ephemeral workspace usage.
        </p>

        <div className="flex shrink-0 gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={decline}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={accept}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
