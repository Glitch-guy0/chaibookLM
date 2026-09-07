'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CitationSnapshot, SourceContent } from '../api';

const IFRAME_LOAD_TIMEOUT_MS = 8_000;

interface WebShowcaseProps {
  content: Extract<SourceContent, { type: 'web' }>;
  citation: CitationSnapshot;
  title: string;
}

/**
 * Web Showcase Reader (Story 4.4: AC-4.4.1)
 * - Sanitized article reader view automatically scrolled to cited paragraph with cyan focus outline
 * - Multi-mode toggle: Article Reader (default, clean & focused) vs Live Embed / Snapshot
 * - High-contrast cyan outline on cited excerpt/paragraph
 */
export function WebShowcase({ content, citation, title }: WebShowcaseProps) {
  const [viewMode, setViewMode] = useState<'reader' | 'embed'>('reader');
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const citedParagraphRef = useRef<HTMLDivElement>(null);

  const excerpt = citation.excerpt || '';

  useEffect(() => {
    if (viewMode === 'embed') {
      setIframeBlocked(false);
      setIframeLoaded(false);
      timeoutRef.current = setTimeout(() => setIframeBlocked(true), IFRAME_LOAD_TIMEOUT_MS);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [content.url, viewMode]);

  // Autoscroll cited paragraph into view in reader mode
  useEffect(() => {
    if (viewMode === 'reader' && citedParagraphRef.current) {
      citedParagraphRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [viewMode, citation.chunkId]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIframeLoaded(true);
  };

  // Sanitized reader paragraphs from markdown or text
  const readerParagraphs = useMemo(() => {
    const raw = content.markdown || content.snapshotHtml || '';
    // Strip raw html tags for clean reader view if markdown not provided
    const cleanText = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n');

    const paras = cleanText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    return paras.length > 0 ? paras : [raw || 'Article content loaded from source.'];
  }, [content.markdown, content.snapshotHtml]);

  // Match cited paragraph
  const matchingParaIndex = useMemo(() => {
    if (!excerpt) return 0;
    const lowerExcerpt = excerpt.toLowerCase().slice(0, 40);
    const idx = readerParagraphs.findIndex((p) => p.toLowerCase().includes(lowerExcerpt));
    return idx >= 0 ? idx : 0;
  }, [readerParagraphs, excerpt]);

  return (
    <div data-debug="WebShowcase" data-testid="web-showcase" className="flex flex-col gap-3">
      <div aria-live="polite" className="sr-only" data-debug="WebAriaLive">
        {`Web Showcase: ${title}`}
      </div>

      {/* Header with Title and Reader / Embed Toggle */}
      <div
        data-debug="WebHeader"
        className="flex items-center justify-between gap-3 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2 rounded-default shadow-[3px_3px_0_0_#111111]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-[#00E5FF] font-mono text-xs font-bold text-ink">
            ↗
          </span>
          <span className="truncate font-mono text-xs font-bold text-ink dark:text-ink-dark">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border-2 border-border dark:border-border-dark overflow-hidden font-mono text-xs font-bold">
            <button
              type="button"
              data-debug="WebReaderModeBtn"
              data-testid="web-mode-reader"
              onClick={() => setViewMode('reader')}
              className={`px-2.5 py-1 ${
                viewMode === 'reader'
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark hover:bg-ink/10'
              }`}
            >
              Reader
            </button>
            <button
              type="button"
              data-debug="WebEmbedModeBtn"
              data-testid="web-mode-embed"
              onClick={() => setViewMode('embed')}
              className={`px-2.5 py-1 ${
                viewMode === 'embed'
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark hover:bg-ink/10'
              }`}
            >
              Live
            </button>
          </div>
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            data-debug="WebExternalLink"
            title="Open in new tab"
            className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-[2px_2px_0_0_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] text-xs font-bold"
          >
            ↗
          </a>
        </div>
      </div>

      {/* Reader View Mode (Clean, focused article view with cyan outline) */}
      {viewMode === 'reader' ? (
        <div
          data-debug="WebArticleReader"
          data-testid="web-article-reader"
          className="max-h-[32rem] overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-5 shadow-[4px_4px_0_0_#111111]"
        >
          {excerpt && (
            <div className="mb-4 font-mono text-xs font-bold text-[#00E5FF] dark:text-[#00E5FF] bg-ink dark:bg-surface-elevated-dark p-2 rounded-sm border border-border dark:border-border-dark flex items-center justify-between">
              <span>PROOFLINK: CITED WEB ASSERTION</span>
              <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark">
                Paragraph {matchingParaIndex + 1}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink dark:text-ink-dark">
            {readerParagraphs.map((para, idx) => {
              const isCited = idx === matchingParaIndex;
              return (
                <div
                  key={idx}
                  ref={isCited ? citedParagraphRef : null}
                  data-debug={isCited ? 'WebCitedParagraph' : 'WebParagraph'}
                  data-testid={isCited ? 'web-cited-paragraph' : 'web-paragraph'}
                  className={`p-3 rounded-sm transition-all duration-200 ${
                    isCited
                      ? 'outline-3 outline-[#00E5FF] bg-[#00E5FF]/15 dark:bg-[#00E5FF]/20 shadow-[3px_3px_0_0_#111111] font-medium'
                      : 'hover:bg-surface-elevated/50 dark:hover:bg-surface-elevated-dark/50'
                  }`}
                >
                  {para}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Embed Mode (Live iframe / Snapshot fallback) */
        <div data-debug="WebEmbedContainer" className="flex flex-col gap-2">
          {!iframeBlocked ? (
            <>
              {!iframeLoaded && (
                <p className="font-mono text-xs text-ink-muted dark:text-ink-muted-dark">
                  Loading {title}…
                </p>
              )}
              <iframe
                key={content.url}
                data-debug="WebIframe"
                src={content.url}
                title={title}
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-popups allow-forms"
                className="h-[30rem] w-full rounded-default border-2 border-border dark:border-border-dark bg-white shadow-[4px_4px_0_0_#111111]"
              />
            </>
          ) : content.snapshotHtml ? (
            <div data-debug="WebSnapshot" className="flex flex-col gap-2">
              <p className="font-mono text-xs text-ink-muted dark:text-ink-muted-dark">
                Showing saved HTML snapshot — live site could not be embedded.
              </p>
              <iframe
                data-debug="WebSnapshotIframe"
                srcDoc={content.snapshotHtml}
                title={`${title} (snapshot)`}
                sandbox=""
                className="h-[30rem] w-full rounded-default border-2 border-border dark:border-border-dark bg-white shadow-[4px_4px_0_0_#111111]"
              />
            </div>
          ) : (
            <div
              data-debug="WebUnavailable"
              className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark rounded-default shadow-[3px_3px_0_0_#111111]"
            >
              <p className="font-mono text-sm font-semibold text-ink dark:text-ink-dark">
                This website cannot be embedded directly.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className="rounded-sm border-2 border-border dark:border-border-dark bg-[#00E5FF] px-3 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0_0_#111111]"
              >
                Switch to Article Reader View
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
