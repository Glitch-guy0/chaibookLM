'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { CitationSnapshot, SourceContent } from '../api';

interface TextShowcaseProps {
  content: Extract<SourceContent, { type: 'text' }>;
  citation: CitationSnapshot;
  title: string;
}

/**
 * Text Showcase Reader (Story 4.4: AC-4.4.2)
 * Renders full Markdown / text source content, automatically scrolling to
 * the cited sentence snippet and highlighting it with a high-contrast cyan mark.
 */
export function TextShowcase({ content, citation, title }: TextShowcaseProps) {
  const markRef = useRef<HTMLElement>(null);
  const text = content.text || content.rawText || '';
  const span = citation.span || { start: 0, end: 0 };
  const excerpt = citation.excerpt || '';

  // Auto-scroll highlight into view
  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [text, span.start, span.end, excerpt]);

  const { before, highlighted, after } = useMemo(() => {
    const len = text.length;
    let start = Math.max(0, Math.min(span.start, len));
    let end = Math.max(start, Math.min(span.end, len));

    // If span is empty or 0..0, try matching via excerpt
    if (start === end && excerpt) {
      const idx = text.toLowerCase().indexOf(excerpt.toLowerCase());
      if (idx !== -1) {
        start = idx;
        end = idx + excerpt.length;
      }
    }

    // If still no valid span, fallback to first 100 chars
    if (start === end) {
      return {
        before: '',
        highlighted: text.slice(0, 100),
        after: text.slice(100),
      };
    }

    return {
      before: text.slice(0, start),
      highlighted: text.slice(start, end),
      after: text.slice(end),
    };
  }, [text, span.start, span.end, excerpt]);

  return (
    <div data-debug="TextShowcase" data-testid="text-showcase" className="flex flex-col gap-3">
      <div aria-live="polite" className="sr-only" data-debug="TextShowcaseAriaLive">
        {`Text Showcase: ${title} — highlighted passage: ${highlighted}`}
      </div>

      <div
        data-debug="TextHeader"
        className="flex items-center justify-between gap-2 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2 rounded-default shadow-[3px_3px_0_0_#111111]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-[#FFE500] font-mono text-xs font-bold text-ink">
            ¶
          </span>
          <span className="truncate font-mono text-xs font-bold text-ink dark:text-ink-dark">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-[#00E5FF] dark:text-[#00E5FF] bg-ink dark:bg-surface-dark px-2 py-0.5 rounded-sm">
          CITED EXCERPT ACTIVE
        </span>
      </div>

      <div
        data-debug="ShowcaseTextView"
        data-testid="text-showcase-content"
        className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 font-sans text-sm leading-relaxed text-ink dark:text-ink-dark shadow-[4px_4px_0_0_#111111]"
      >
        <span>{before}</span>
        <mark
          ref={markRef}
          data-debug="ShowcaseTextHighlight"
          data-testid="text-highlight-mark"
          className="rounded-sm border-2 border-border dark:border-border-dark bg-[#00E5FF]/40 dark:bg-[#00E5FF]/50 text-ink dark:text-ink-dark px-1 py-0.5 font-medium shadow-[2px_2px_0_0_#111111]"
        >
          {highlighted}
        </mark>
        <span>{after}</span>
      </div>
    </div>
  );
}
