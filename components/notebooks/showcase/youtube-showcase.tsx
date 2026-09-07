'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CitationSnapshot, SourceContent } from '../api';

interface YouTubeShowcaseProps {
  content: Extract<SourceContent, { type: 'youtube' }>;
  citation: CitationSnapshot;
  title: string;
}

/**
 * YouTube Showcase with Player Sync & Autoscrolling Transcript (Story 4.3: AC-4.3.1 - AC-4.3.3)
 * - Seeks embedded player to cited timestampSeconds
 * - Synchronized autoscrolling transcript dialogue list
 * - Cyan highlight on active cue with bold monospace timestamp label
 * - Clickable cues seek player to selected timestamp
 */
export function YouTubeShowcase({ content, citation, title }: YouTubeShowcaseProps) {
  const initialSeconds = citation.timestampSeconds ?? 0;
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const activeCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (citation.timestampSeconds !== undefined) {
      setCurrentSeconds(citation.timestampSeconds);
    }
  }, [citation.chunkId, citation.timestampSeconds]);

  // Autoscroll to active dialogue cue
  useEffect(() => {
    if (activeCueRef.current) {
      activeCueRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSeconds]);

  const videoId = useMemo(() => {
    if (content.videoId) return content.videoId;
    try {
      const parsed = new URL(content.url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.slice(1).split('?')[0] || '';
      }
      return parsed.searchParams.get('v') || '';
    } catch {
      return '';
    }
  }, [content.url, content.videoId]);

  const embedUrl = useMemo(() => {
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?start=${currentSeconds}&autoplay=1&enablejsapi=1`;
  }, [videoId, currentSeconds]);

  const transcript = content.transcript || [];

  // Find index of closest matching cue
  const activeCueIndex = useMemo(() => {
    if (transcript.length === 0) return -1;
    let closestIdx = 0;
    let minDiff = Infinity;
    transcript.forEach((cue, idx) => {
      const diff = Math.abs(cue.timestampSeconds - currentSeconds);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  }, [transcript, currentSeconds]);

  const formattedActiveTime = useMemo(() => {
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
  }, [currentSeconds]);

  return (
    <div
      data-debug="YouTubeShowcase"
      data-testid="youtube-showcase"
      data-od-id="showcase-yt"
      className="flex flex-col gap-3"
    >
      <div aria-live="polite" className="sr-only" data-debug="YouTubeAriaLive">
        {`YouTube Showcase: ${title} at ${formattedActiveTime}`}
      </div>

      {/* Header with Title and active timestamp */}
      <div
        data-debug="YouTubeHeader"
        className="flex items-center justify-between gap-2 border-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2 rounded-default shadow-[3px_3px_0_0_#111111]"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-[#FF3333] font-mono text-xs font-bold text-white">
            ▶
          </span>
          <span className="truncate font-mono text-xs font-bold text-ink dark:text-ink-dark">
            {title}
          </span>
        </div>
        <span
          data-debug="YouTubeTimestampBadge"
          data-testid="youtube-timestamp-badge"
          className="shrink-0 font-mono text-xs font-bold text-[#00E5FF] dark:text-[#00E5FF] bg-ink dark:bg-surface-dark px-2 py-0.5 rounded-sm border border-border dark:border-border-dark"
        >
          {formattedActiveTime}
        </span>
      </div>

      {/* Embedded YouTube Player */}
      <div
        data-debug="YouTubePlayerContainer"
        className="relative w-full aspect-video overflow-hidden rounded-default border-2 border-border dark:border-border-dark bg-black shadow-[4px_4px_0_0_#111111]"
      >
        {embedUrl ? (
          <iframe
            key={`${videoId}-${currentSeconds}`}
            data-debug="YouTubeIframe"
            data-testid="youtube-player"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white">
            <span className="font-mono text-sm font-semibold">Video preview unavailable</span>
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#00E5FF] underline"
            >
              Open on YouTube ↗
            </a>
          </div>
        )}
      </div>

      {/* Autoscrolling Transcript Dialogue List */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
            Synchronized Transcript
          </span>
          <span className="font-mono text-[10px] text-ink-muted dark:text-ink-muted-dark">
            Click cue to seek
          </span>
        </div>

        <div
          data-debug="YouTubeTranscriptList"
          data-testid="youtube-transcript-list"
          data-od-id="transcript"
          className="max-h-[16rem] overflow-y-auto rounded-default border-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-2 shadow-[3px_3px_0_0_#111111]"
        >
          {transcript.length === 0 ? (
            <div className="p-4 text-center font-mono text-xs text-ink-muted dark:text-ink-muted-dark">
              No timestamped captions available for this video.
            </div>
          ) : (
            transcript.map((cue, idx) => {
              const isActive = idx === activeCueIndex;
              return (
                <div
                  key={`${cue.timestampSeconds}-${idx}`}
                  ref={isActive ? activeCueRef : null}
                  data-debug={isActive ? 'YouTubeActiveCue' : 'YouTubeCue'}
                  data-testid={isActive ? 'youtube-active-cue' : 'youtube-cue'}
                  data-od-id={isActive ? 'transcript-hl' : undefined}
                  onClick={() => setCurrentSeconds(cue.timestampSeconds)}
                  className={`flex items-start gap-2.5 p-2 rounded-sm cursor-pointer transition-all duration-150 border-l-4 mb-1 ${
                    isActive
                      ? 'border-[#00E5FF] bg-[#00E5FF]/20 dark:bg-[#00E5FF]/25 shadow-[2px_2px_0_0_#111111]'
                      : 'border-transparent hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark'
                  }`}
                >
                  <span
                    data-debug="CueTimestamp"
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
    </div>
  );
}
