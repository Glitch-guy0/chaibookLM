import Link from 'next/link';
import { Button } from '@components/ui/button';
import { RevealSection } from './reveal-section';

/**
 * Final CTA section — matching mockup-landing.html .cta-final.
 */
export function LandingCta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
      <RevealSection>
        <div className="border-2 border-border dark:border-border-dark bg-accent text-[#111111] p-8 sm:p-12 shadow-[10px_10px_0_0_var(--border,#111111)] dark:shadow-[10px_10px_0_0_var(--border-dark,#E4E4E7)] text-center space-y-6">
          <h2 className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-tight">
            Start researching in seconds.
          </h2>
          <p className="max-w-xl mx-auto font-sans text-base sm:text-lg text-[#111111]/90 font-medium leading-relaxed">
            Create your first notebook now. Drop in a PDF or paste a link, and ask your first grounded question.
          </p>
          <div className="pt-2">
            <Link href="/sign-in">
              <Button variant="secondary" size="lg" className="bg-surface text-ink hover:bg-surface">
                Get started now →
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>
    </section>
  );
}
