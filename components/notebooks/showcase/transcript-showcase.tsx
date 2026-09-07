'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CitationSnapshot, SourceContent } from '../api';

interface TranscriptShowcaseProps {
  content: Extract<SourceContent, { type: 'transcript' }>;
  citation: CitationSnapshot;
  title: string;
}

/**
 * Subtitle Transcript Showcase (Story 4.3: AC-4.3.1 & AC-4.3.3)
 * Displays dialogue with [mm:ss] timestamp cues, autoscrolls to cited timestamp,
 * and highlights active dialogue line in high-contrast cyan.
 */
export function TranscriptShowcase({ content, citation, title }: TranscriptShowcaseProps) {
  const initialSeconds = citation.timestampSeconds ?? 0;
  const [activeSeconds, setActiveSeconds] = useState(initialSeconds);
  const activeCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (citation.timestampSeconds !== undefined) {
      setActiveSeconds(citation.timestampSeconds);
    }
  }, [citation.chunkId, citation.timestampSeconds]);

  useEffect(() => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSeconds]);

  const dialogue = content.dialogue || [];

  const activeIndex = useMemo(() => {
    if (dialogue.length === 0) return -1;
    let closestIdx = 0;
    let minDiff = Infinity;
    dialogue.forEach((cue, idx) => {
      const diff = Math.abs(cue.timestampSeconds - activeSeconds);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  }, [dialogue, activeSeconds]);

  return (
    <div
      data-debug="TranscriptShowcase"
      data-testid="transcript-showcase"
      className="flex flex-col gap-3"
    >
      <div aria-live="polite" className="sr-only" data-debug="TranscriptAriaLive">
        {`Transcript Showcase: ${title}`}
      </div>

      <div
        data-debug="TranscriptHeader"
        className="flex items-center justify-between gap-2 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2 rounded-default shadow-[3px_3px_0_0_#111111]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-[#FFE500] font-mono text-xs font-bold text-ink">
            💬
          </span>
          <span className="truncate font-mono text-xs font-bold text-ink dark:text-ink-dark">
            {title}
          </span>
        </div>
      </div>

      <div
        data-debug="TranscriptDialogueContainer"
        className="max-h-[30rem] overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 shadow-[4px_4px_0_0_#111111]"
      >
        {dialogue.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-ink-muted dark:text-ink-muted-dark">
            No dialogue lines found in transcript.
          </div>
        ) : (
          dialogue.map((cue, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={`${cue.timestampSeconds}-${idx}`}
                ref={isActive ? activeCueRef : null}
                onClick={() => setActiveSeconds(cue.timestampSeconds)}
                className={`flex items-start gap-3 p-2.5 rounded-sm cursor-pointer transition-all duration-150 border-l-4 mb-1.5 ${
                  isActive
                    ? 'border-[#00E5FF] bg-[#00E5FF]/20 dark:bg-[#00E5FF]/25 shadow-[2px_2px_0_0_#111111]'
                    : 'border-transparent hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark'
                }`}
              >
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    isActive
                      ? 'text-ink dark:text-ink-dark font-black'
                      : 'text-ink-muted dark:text-ink-muted-dark'
                  }`}
                >
                  [{cue.formattedTime}]
                </span>
                <p
                  className={`text-xs leading-relaxed ${
                    isActive
                      ? 'font-bold text-ink dark:text-ink-dark'
                      : 'text-ink-secondary dark:text-ink-secondary-dark'
                  }`}
                >
                  {cue.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
