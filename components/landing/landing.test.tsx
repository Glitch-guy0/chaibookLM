import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { prefersReducedMotion } from './use-scroll-reveal';
import { LandingHero } from './landing-hero';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    // @ts-expect-error -- test-only global cleanup
    delete globalThis.window;
  });

  it('returns false when window/matchMedia is unavailable (SSR, no-JS)', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when the OS/browser requests reduced motion', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    // @ts-expect-error -- minimal window stub for this pure check
    globalThis.window = { matchMedia };

    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('returns false when reduced motion is not requested', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    // @ts-expect-error -- minimal window stub for this pure check
    globalThis.window = { matchMedia };

    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('LandingHero', () => {
  it('renders a link to /sign-in as the primary CTA', () => {
    const html = renderToStaticMarkup(<LandingHero />);
    expect(html).toContain('href="/sign-in"');
    expect(html).toMatch(/Get started/);
  });
});
