import Link from 'next/link';
import { buttonBaseClasses, buttonVariantClasses } from '@components/ui/button';
import { RevealSection } from './reveal-section';

/**
 * Final CTA section — reiterates the value prop and links to /sign-in.
 */
export function LandingCta() {
  return (
    <section
      data-debug="LandingCta"
      className="border-t-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-4 py-16 sm:px-8 sm:py-24"
    >
      <RevealSection className="mx-auto flex max-w-2xl flex-col items-start gap-6 text-left sm:items-center sm:text-center sm:mx-auto">
        <h2 className="font-display text-3xl text-ink dark:text-ink-dark sm:text-4xl">
          Trust what you read. Trace where it came from.
        </h2>
        <p className="max-w-xl font-sans text-base text-ink-secondary dark:text-ink-secondary-dark">
          Start a notebook and see grounded, citable answers for yourself.
        </p>
        <Link
          href="/sign-in"
          data-debug="LandingCtaLink"
          className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`}
        >
          <span className="inline-block [transform:skewX(6deg)]">Get started</span>
        </Link>
      </RevealSection>
    </section>
  );
}
