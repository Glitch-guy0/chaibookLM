'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useScrollReveal } from './use-scroll-reveal';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  'data-debug'?: string;
}

/**
 * Progressive-enhancement scroll reveal wrapper.
 *
 * The section is fully visible in server-rendered markup (no `hidden` /
 * `opacity-0` baked into the initial className) so content is never hidden
 * without JS. Once mounted, a client-only effect flips to a hidden-until-
 * intersecting state; `useScrollReveal` immediately reports `isVisible: true`
 * under reduced-motion or when IntersectionObserver is unavailable, so the
 * hidden state is only ever transient on capable, motion-enabled browsers.
 */
export function RevealSection({ children, className = '', ...rest }: RevealSectionProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const [jsReady, setJsReady] = useState(false);

  useEffect(() => {
    setJsReady(true);
  }, []);

  const revealClasses = jsReady && !isVisible ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0';

  return (
    <div
      ref={ref}
      data-debug={rest['data-debug'] ?? 'RevealSection'}
      className={`transition-all duration-500 ease-out ${revealClasses} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
