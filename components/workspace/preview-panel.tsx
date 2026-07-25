"use client";

import {
  X,
  ExternalLink,
  FileText,
  Youtube,
  Globe,
  FileCode,
  AlignLeft,
  BookOpen,
  Hash,
} from "lucide-react";
import { Citation } from "./chat-panel";
import { Source } from "./sidebar";

interface PreviewPanelProps {
  activeCitation: Citation | null;
  activeSource: Source | null;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-primary shrink-0" />,
  youtube: <Youtube className="w-4 h-4 text-error shrink-0" />,
  web: <Globe className="w-4 h-4 text-success shrink-0" />,
  vtt: <FileCode className="w-4 h-4 text-accent shrink-0" />,
  text: <AlignLeft className="w-4 h-4 text-secondary shrink-0" />,
};

export function PreviewPanel({
  activeCitation,
  activeSource,
  onClose,
}: PreviewPanelProps) {
  const isOpen = Boolean(activeCitation || activeSource);
  if (!isOpen) return null;

  const title =
    activeCitation?.sourceTitle || activeSource?.title || "Source Preview";
  const type =
    activeCitation?.sourceType || activeSource?.type || "text";
  const page = activeCitation?.pageNumber || 1;
  const timestamp = activeCitation?.timestampStart || 0;
  const snippet =
    activeCitation?.text ||
    (activeSource as any)?.contentSnippet ||
    "";
  const urlOrPath = (activeSource as any)?.urlOrPath || "#";
  const chunkIndex = activeCitation?.chunkIndex;
  const totalChunks = activeCitation?.totalChunks;

  const hasPosition =
    chunkIndex !== undefined && totalChunks !== undefined;

  // Simulated surrounding context: 2 sentences before and after the highlighted chunk
  const contextBefore =""
  const contextAfter =""
  return (
    <aside className="w-96 border-l border-[hsl(215_25%_22%/0.6)] flex flex-col h-full animate-slide-in-right shadow-2xl z-20 bg-[hsl(var(--bg-h)_var(--bg-s)_var(--bg-l))]">
      {/* Panel Header */}
      <div className="p-4 border-b border-[hsl(215_25%_22%/0.6)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
          {typeIcons[type] || typeIcons["text"]}
          <span className="font-display font-medium text-body text-text truncate">
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-[hsl(var(--surface-h)_var(--surface-s)_var(--surface-l))] transition-colors shrink-0"
          aria-label="Close preview panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── YOUTUBE: dedicated embed viewer ─── */}
        {type === "youtube" ? (
          <div className="p-4 space-y-3">
            {/* Metadata strip */}
            <div className="flex items-center justify-between text-mono-sm text-text-muted px-1">
              <span className="flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-error" />
                YouTube Video
              </span>
              <span>{timestamp}s</span>
            </div>

            {/* Embed */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[hsl(215_25%_22%/0.6)] relative">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${
                  urlOrPath.includes("v=")
                    ? urlOrPath.split("v=")[1]?.split("&")[0]
                    : "dQw4w9WgXcQ"
                }?start=${timestamp}&autoplay=1`}
                title="YouTube Source Viewer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="text-body-sm text-text-muted flex items-center justify-between px-1">
              <span>Seeked to {timestamp}s</span>
              <a
                href={urlOrPath}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Open video <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          /* ─── ALL OTHER TYPES: document viewer with highlight ─── */
          <div className="p-4 space-y-3">
            {/* Metadata strip */}
            <div className="flex items-center justify-between text-mono-sm text-text-muted bg-[hsl(var(--surface-h)_var(--surface-s)_var(--surface-l)/0.6)] rounded-lg px-3 py-2 border border-[hsl(215_25%_22%/0.5)]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                {type === "pdf"
                  ? `Page ${page}`
                  : type === "vtt"
                  ? `At ${timestamp}s`
                  : type === "web"
                  ? "Web Page"
                  : "Text Source"}
              </span>
              {hasPosition && (
                <span className="flex items-center gap-1 text-accent font-medium">
                  <Hash className="w-3 h-3" />
                  Passage {(chunkIndex ?? 0) + 1} of {totalChunks}
                </span>
              )}
            </div>

            {/* Document viewer */}
            <div className="rounded-xl border border-[hsl(215_25%_22%/0.5)] overflow-hidden bg-[hsl(var(--surface-h)_var(--surface-s)_var(--surface-l)/0.4)]">
              {/* Document content area */}
              <div className="p-4 space-y-3 text-body-sm leading-relaxed font-body">

                {/* Context before — muted */}
                {snippet && (
                  <p className="text-text-muted/70 italic border-l-2 border-transparent pl-3">
                    {contextBefore}
                  </p>
                )}

                {/* ─── Highlighted cited passage ─── */}
                {snippet ? (
                  <div className="relative">
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-primary via-accent to-secondary" />
                    <div className="pl-4 pr-3 py-3 rounded-r-xl bg-[hsl(var(--accent-h)_var(--accent-s)_var(--accent-l)/0.08)] border border-[hsl(var(--accent-h)_var(--accent-s)_var(--accent-l)/0.2)]">
                      {/* Citation label */}
                      <div className="text-mono-sm text-accent font-semibold mb-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-accent/20 text-accent text-[10px] font-bold">
                          ✦
                        </span>
                        Cited Passage
                        {hasPosition && (
                          <span className="text-text-muted font-normal">
                            — Passage {(chunkIndex ?? 0) + 1}
                            {totalChunks ? ` of ${totalChunks}` : ""}
                          </span>
                        )}
                      </div>
                      {/* The actual text */}
                      <p className="text-text leading-relaxed">
                        &ldquo;{snippet}&rdquo;
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pl-4 py-3 rounded-r-xl bg-surface/40 border-l-2 border-border/40 text-text-muted italic">
                    Passage content referenced by AI answer.
                  </div>
                )}

                {/* Context after — muted */}
                {snippet && (
                  <p className="text-text-muted/70 italic border-l-2 border-transparent pl-3">
                    {contextAfter}
                  </p>
                )}
              </div>

              {/* Footer: source metadata */}
              <div className="px-4 py-3 border-t border-[hsl(215_25%_22%/0.5)] flex items-center justify-between text-mono-sm text-text-muted bg-[hsl(var(--surface-h)_var(--surface-s)_var(--surface-l)/0.3)]">
                <span className="flex items-center gap-1.5">
                  {typeIcons[type] || typeIcons["text"]}
                  {type.toUpperCase()}
                  {type === "pdf" && ` · Page ${page}`}
                  {type === "vtt" && ` · ${timestamp}s`}
                </span>
                {(type === "web" || type === "youtube") && urlOrPath !== "#" && (
                  <a
                    href={urlOrPath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 transition-colors"
                  >
                    Open source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
