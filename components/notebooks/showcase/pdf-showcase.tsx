'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CitationSnapshot, SourceContent } from '../api';

interface PdfShowcaseProps {
  content: Extract<SourceContent, { type: 'pdf' }>;
  citation: CitationSnapshot;
  title: string;
}

/**
 * PDF Original View Showcase (Story 4.2: AC-4.2.1 - AC-4.2.4)
 * - Jump directly to cited pageNumber
 * - Header displays "Page X of Y" with prev/next navigation controls
 * - Keyboard shortcuts: `[` (prev) and `]` (next)
 * - High-contrast cyan bounding box (3px solid #00E5FF with tint) highlights cited text for 2.5s
 */
export function PdfShowcase({ content, citation, title }: PdfShowcaseProps) {
  const initialPage = citation.pageNumber ?? 1;
  const totalPages = Math.max(1, content.totalPages || content.pages?.length || 1);
  const [currentPage, setCurrentPage] = useState(() =>
    Math.max(1, Math.min(initialPage, totalPages)),
  );
  const [highlightActive, setHighlightActive] = useState(true);
  const highlightRef = useRef<any>(null);

  // Sync with citation changes
  useEffect(() => {
    if (citation.pageNumber !== undefined) {
      setCurrentPage(Math.max(1, Math.min(citation.pageNumber, totalPages)));
    }
    setHighlightActive(true);
    const timer = setTimeout(() => {
      setHighlightActive(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [citation.chunkId, citation.pageNumber, totalPages]);

  // Keyboard navigation shortcuts: [ for prev, ] for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing inside an input/textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === ']') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  // Auto-scroll highlight into view
  useEffect(() => {
    if (highlightActive && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentPage, highlightActive]);

  const currentPageData = useMemo(() => {
    const found = content.pages?.find((p) => p.pageNumber === currentPage);
    if (found) return found.text;
    // Fallback if pages array is index-based or text contains page markers
    if (content.pages && content.pages[currentPage - 1]) {
      return content.pages[currentPage - 1].text;
    }
    return content.rawText || 'No text extracted for this page.';
  }, [content, currentPage]);

  const excerpt = citation.excerpt || '';

  // Render excerpt highlight inside page text
  const renderedPageContent = useMemo(() => {
    if (!excerpt || !currentPageData.toLowerCase().includes(excerpt.toLowerCase().slice(0, 40))) {
      return (
        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-ink-dark">
          {excerpt && (
            <div
              ref={highlightRef}
              data-debug="PdfHighlightBox"
              data-testid="pdf-bounding-box"
              data-od-id="highlight-box"
              className={`mb-4 p-3 rounded-sm border-3 border-[#00E5FF] bg-[#00E5FF]/20 shadow-[3px_3px_0_0_#111111] transition-all duration-300 ${
                highlightActive ? 'ring-2 ring-[#00E5FF]' : 'opacity-90'
              }`}
            >
              <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
                Cited Excerpt
              </div>
              <p className="font-sans text-sm font-medium text-ink dark:text-ink-dark">
                {excerpt}
              </p>
            </div>
          )}
          <p>{currentPageData}</p>
        </div>
      );
    }

    // Locate excerpt snippet in page text
    const searchIdx = currentPageData.toLowerCase().indexOf(excerpt.toLowerCase());
    if (searchIdx === -1) {
      return (
        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-ink-dark">
          <p>{currentPageData}</p>
        </div>
      );
    }

    const before = currentPageData.slice(0, searchIdx);
    const match = currentPageData.slice(searchIdx, searchIdx + excerpt.length);
    const after = currentPageData.slice(searchIdx + excerpt.length);

    return (
      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-ink-dark">
        <span>{before}</span>
        <span
          ref={highlightRef}
          data-debug="PdfHighlightBox"
          data-testid="pdf-bounding-box"
          data-od-id="highlight-box"
          className={`inline p-1 rounded-sm border-3 border-[#00E5FF] bg-[#00E5FF]/25 shadow-[2px_2px_0_0_#111111] transition-all duration-300 ${
            highlightActive ? 'ring-2 ring-[#00E5FF]' : 'opacity-90'
          }`}
        >
          {match}
        </span>
        <span>{after}</span>
      </div>
    );
  }, [currentPageData, excerpt, highlightActive]);

  return (
    <div data-debug="PdfShowcase" data-testid="pdf-showcase" className="flex flex-col gap-3">
      <div aria-live="polite" className="sr-only" data-debug="PdfAriaLive">
        {`PDF View: ${title}, Page ${currentPage} of ${totalPages}`}
      </div>

      {/* Header with document title and page jumper */}
      <div
        data-debug="PdfHeader"
        className="flex items-center justify-between gap-3 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2 rounded-default shadow-[3px_3px_0_0_#111111]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-[#FFE500] font-mono text-xs font-bold text-ink">
            PDF
          </span>
          <span className="truncate font-mono text-xs font-bold text-ink dark:text-ink-dark">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          <button
            type="button"
            data-debug="PdfPagePrev"
            data-testid="pdf-prev-page"
            data-od-id="page-prev"
            title="Previous page (Shortcut: [)"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-[2px_2px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ‹
          </button>
          <span
            data-debug="PdfPageIndicator"
            data-testid="pdf-page-indicator"
            className="min-w-[80px] text-center text-ink dark:text-ink-dark"
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            data-debug="PdfPageNext"
            data-testid="pdf-next-page"
            data-od-id="page-next"
            title="Next page (Shortcut: ])"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-[2px_2px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      {/* PDF Page Document Sheet */}
      <div
        data-debug="PdfSheet"
        className="max-h-[34rem] overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6 shadow-[4px_4px_0_0_#111111]"
      >
        <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-border/30 dark:border-border-dark/30 pb-2">
          <span className="font-mono text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">
            PAGE {currentPage}
          </span>
          {highlightActive && (
            <span className="font-mono text-[10px] font-bold text-[#00E5FF] dark:text-[#00E5FF] bg-ink dark:bg-white px-2 py-0.5 rounded-sm">
              CYAN PROOF ACTIVE (2.5s)
            </span>
          )}
        </div>
        {renderedPageContent}
      </div>
    </div>
  );
}
