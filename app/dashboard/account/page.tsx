'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useConsent } from '@components/consent/consent-context';
import { Button } from '@components/ui/button';
import { fetchNotebooks } from '@components/notebooks/api';

/**
 * Account page — protected by the dashboard layout's auth guard. Hosts the
 * cookie-preferences section and the "Replay product tour" control.
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });

  const notebooks = data?.notebooks ?? [];
  const hasNotebooks = notebooks.length > 0;

  const handleReplayTour = () => {
    if (!hasNotebooks) {
      return;
    }
    const mostRecent = notebooks[0];
    if (!mostRecent?.id) return;
    router.push(`/dashboard/notebook/${encodeURIComponent(mostRecent.id)}?tour=replay`);
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-xl font-mono font-bold text-ink dark:text-ink-dark tracking-tight">
        ACCOUNT
      </h2>

      <div className="mt-6 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 shadow-[5px_5px_0_0_var(--border,#111111)]">
        <h3 className="text-base font-mono font-bold text-ink dark:text-ink-dark uppercase tracking-wide">
          Cookie Preferences
        </h3>

        <p className="mt-2 text-sm font-sans text-ink dark:text-ink-dark">
          We store minimal local cookies related to session, preferences, and usage.
          Current choice: <strong>{statusLabel}</strong>
        </p>

        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={decline}
            disabled={consent === 'declined'}
          >
            Decline
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={accept}
            disabled={consent === 'accepted'}
          >
            Accept
          </Button>
        </div>
      </div>

      <div className="mt-6 border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 shadow-[5px_5px_0_0_var(--border,#111111)]">
        <h3 className="text-base font-mono font-bold text-ink dark:text-ink-dark uppercase tracking-wide">
          Product Tour
        </h3>

        <p className="mt-2 text-sm font-sans text-ink dark:text-ink-dark">
          Replay the guided walkthrough of Sources, Chat, and Showcase.
        </p>

        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            onClick={handleReplayTour}
            disabled={isLoading || isError || !hasNotebooks}
          >
            Replay product tour
          </Button>
        </div>

        {!isLoading && isError && (
          <p
            role="status"
            className="mt-3 text-sm font-mono font-bold text-danger"
          >
            Couldn&apos;t load your notebooks. Try reloading the page.
          </p>
        )}

        {!isLoading && !isError && !hasNotebooks && (
          <p
            role="status"
            className="mt-3 text-sm font-mono text-muted"
          >
            Create a notebook first to replay the tour.
          </p>
        )}
      </div>
    </section>
  );
}
