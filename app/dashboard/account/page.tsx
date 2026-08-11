'use client';

import { useConsent } from '@components/consent/consent-context';
import { Button } from '@components/ui/button';

/**
 * Account page — protected by the dashboard layout's auth guard. Currently
 * hosts the cookie-preferences section so the visitor's consent decision
 * can be revisited/changed at any time.
 */
export default function AccountPage() {
  const { consent, accept, decline } = useConsent();

  const statusLabel =
    consent === 'accepted'
      ? 'Accepted'
      : consent === 'declined'
        ? 'Declined'
        : 'No decision yet';

  return (
    <section data-debug="AccountPage" className="mx-auto max-w-2xl">
      <h2 className="text-xl font-display text-ink dark:text-ink-dark tracking-tight">
        Account
      </h2>

      <div
        data-debug="CookiePreferences"
        className="mt-6 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark p-6"
      >
        <h3 className="text-lg font-display text-ink dark:text-ink-dark tracking-tight">
          Cookie preferences
        </h3>

        <p className="mt-2 text-sm text-ink dark:text-ink-dark">
          We store cookies related to session, preferences, and usage.
          Current choice: <strong>{statusLabel}</strong>
        </p>

        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            data-debug="AccountDeclineButton"
            onClick={decline}
            disabled={consent === 'declined'}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            data-debug="AccountAcceptButton"
            onClick={accept}
            disabled={consent === 'accepted'}
          >
            Accept
          </Button>
        </div>
      </div>
    </section>
  );
}
