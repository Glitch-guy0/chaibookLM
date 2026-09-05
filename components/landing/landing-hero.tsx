import Link from 'next/link';
import { buttonBaseClasses, buttonVariantClasses } from '@components/ui/button';

/**
 * Landing hero — product name, tagline, primary CTA to /sign-in.
 * Renders above the fold, no reveal transition (it's already visible on load).
 */
export function LandingHero() {
  return (
    <section
      data-debug="LandingHero"
      className="flex min-h-[80vh] flex-col justify-center gap-6 px-4 py-16 sm:px-8"
    >
      <p className="font-sans text-sm font-semibold uppercase tracking-wider text-ink-secondary dark:text-ink-secondary-dark">
        Contextual
      </p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink dark:text-ink-dark sm:text-5xl md:text-6xl">
        Ask your sources. Get answers you can trace back word for word.
      </h1>
      <p className="max-w-2xl font-sans text-base text-ink-secondary dark:text-ink-secondary-dark sm:text-lg">
        Contextual turns your documents into a grounded, verifiable research
        notebook — every answer links straight back to the exact passage it
        came from.
      </p>
      <div className="mt-4">
        <Link
          href="/sign-in"
          data-debug="LandingHeroCta"
          className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`}
        >
          <span className="inline-block [transform:skewX(6deg)]">Get started</span>
        </Link>
      </div>
    </section>
  );
}
