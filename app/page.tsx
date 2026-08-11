import { LandingHero } from '@components/landing/landing-hero';
import { LandingStory } from '@components/landing/landing-story';
import { LandingCta } from '@components/landing/landing-cta';

/**
 * Public landing page. Statically optimized (no `force-dynamic`, no auth
 * lookups) — the authenticated experience lives at /dashboard.
 *
 * `scroll-smooth` is safe to apply unconditionally here: the global reduced
 * motion media query in app/globals.css already forces
 * `scroll-behavior: auto !important`, overriding this at the OS-preference
 * level.
 */
export default function LandingPage() {
  return (
    <main data-debug="LandingPage" className="scroll-smooth bg-surface dark:bg-surface-dark">
      <LandingHero />
      <LandingStory />
      <LandingCta />
    </main>
  );
}
