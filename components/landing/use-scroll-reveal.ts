'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True when the visitor's OS/browser requests reduced motion, or when
 * `matchMedia` isn't available (e.g. during SSR/tests). Exported standalone
 * so it can be unit tested without mounting a component.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Scroll-reveal primitive backed by IntersectionObserver. Returns a ref to
 * attach to the section and an `isVisible` flag consumers use to toggle the
 * reveal transition classes.
 *
 * Progressive enhancement: base/server-rendered markup must already be
 * visible (isVisible starts `false` here only to drive the *client-only*
 * enter transition — consumers are expected to render fully visible content
 * by default and only apply the hidden-until-revealed classes once JS has
 * mounted, see RevealSection).
 *
 * Reduced motion and missing IntersectionObserver support both short-circuit
 * to `isVisible = true` immediately, so nothing ever stays hidden.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0 },
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return { ref, isVisible };
}
