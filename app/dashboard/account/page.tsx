'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useConsent } from '@components/consent/consent-context';
import { Button } from '@components/ui/button';
import { fetchNotebooks } from '@components/notebooks/api';

/**
 * Account page — protected by the dashboard layout's auth guard. Hosts the
 * cookie-preferences section (story 5.3) and the "Replay product tour"
 * control (story 5.4) so both decisions can be revisited at any time.
 */
export default function AccountPage() {
  const { consent, accept, decline } = useConsent();
  const router = useRouter();

  const statusLabel =
    consent === 'accepted'
      ? 'Accepted'
      : consent === 'declined'
        ? 'Declined'
        : 'No decision yet';

  // Same notebooks-list query NotebookGrid uses -- reused here purely to
  // check "does this user have at least one notebook to replay the tour on."
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });

  const notebooks = data?.notebooks ?? [];
  const hasNotebooks = notebooks.length > 0;

  const handleReplayTour = () => {
    if (!hasNotebooks) {
      // Block If: zero notebooks -- deterministic empty-state, no navigation.
      return;
    }
    // Most-recently-used notebook: the list is returned most-recent-first
    // (see fetchNotebooks/NotebookGrid), so the first entry is it.
    const mostRecent = notebooks[0];
    if (!mostRecent?.id) return;
    router.push(`/dashboard/notebook/${encodeURIComponent(mostRecent.id)}?tour=replay`);
  };

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

      <div
        data-debug="ProductTourSection"
        className="mt-6 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark p-6"
      >
        <h3 className="text-lg font-display text-ink dark:text-ink-dark tracking-tight">
          Product tour
        </h3>

        <p className="mt-2 text-sm text-ink dark:text-ink-dark">
          Replay the guided walkthrough of Sources, Chat, and Showcase.
        </p>

        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            data-debug="ReplayTourButton"
            onClick={handleReplayTour}
            disabled={isLoading || isError || !hasNotebooks}
          >
            Replay product tour
          </Button>
        </div>

        {!isLoading && isError && (
          <p
            data-debug="ReplayTourErrorMessage"
            role="status"
            className="mt-3 text-sm font-semibold text-error dark:text-error-dark"
          >
            Couldn&apos;t load your notebooks. Try reloading the page.
          </p>
        )}

        {!isLoading && !isError && !hasNotebooks && (
          <p
            data-debug="ReplayTourBlockedMessage"
            role="status"
            className="mt-3 text-sm font-semibold text-ink-secondary dark:text-ink-secondary-dark"
          >
            Create a notebook first to replay the tour.
          </p>
        )}
      </div>
    </section>
  );
}
