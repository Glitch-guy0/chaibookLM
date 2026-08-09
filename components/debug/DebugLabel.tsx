'use client';

import { useMemo } from 'react';

interface DebugLabelProps {
  /** The component name to display in the debug overlay. */
  name: string;
}

/**
 * In dev mode or when `NEXT_PUBLIC_UX_DEBUG === 'true'`, renders a zero-impact
 * overlay with the component's debug name.
 *
 * In production or when debug is disabled, renders nothing.
 *
 * Uses the `data-debug` attribute approach — the CSS in `globals.css` handles
 * the visual overlay via `::before`.
 */
export function DebugLabel({ name }: DebugLabelProps) {
  const isDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_UX_DEBUG === 'true'
    );
  }, []);

  if (!isDebug) return null;

  // Render a zero-size hidden span that carries the data-debug attribute.
  // The globals.css [data-debug]::before rule renders the overlay.
  // The clip ensures the element takes no visual space while keeping the
  // ::before pseudo-element visible.
  return (
    <span
      data-debug={name}
      style={{
        position: 'absolute',
        clip: 'rect(0,0,0,0)',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}