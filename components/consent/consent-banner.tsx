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
      data-debug="ConsentBanner"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-6 py-4 shadow-card dark:shadow-card-dark"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-ink dark:text-ink-dark">
          We are storing cookies related to session, preferences, and usage.
        </p>

        <div className="flex shrink-0 gap-3">
          <Button
            type="button"
            variant="secondary"
            data-debug="ConsentDeclineButton"
            onClick={decline}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            data-debug="ConsentAcceptButton"
            onClick={accept}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
