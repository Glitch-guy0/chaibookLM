"use client";

import { X, ExternalLink, FileText, Youtube, Globe, FileCode, AlignLeft } from "lucide-react";
import { Citation } from "./chat-panel";
import { Source } from "./sidebar";

interface PreviewPanelProps {
  activeCitation: Citation | null;
  activeSource: Source | null;
  onClose: () => void;
}

export function PreviewPanel({
  activeCitation,
  activeSource,
  onClose,
}: PreviewPanelProps) {
  const isOpen = Boolean(activeCitation || activeSource);
  if (!isOpen) return null;

  const title = activeCitation?.sourceTitle || activeSource?.title || "Source Preview";
  const type = activeCitation?.sourceType || activeSource?.type || "text";
  const page = activeCitation?.pageNumber || 1;
  const timestamp = activeCitation?.timestampStart || 0;
  const snippet = activeCitation?.text || (activeSource as any)?.contentSnippet || "";
  const urlOrPath = activeSource?.urlOrPath || "#";

  return (
    <aside className="w-96 glass border-l border-border/40 flex flex-col h-full animate-slide-in-right shadow-2xl z-20">
      {/* Panel Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate pr-2">
          {type === "pdf" && <FileText className="w-4 h-4 text-primary shrink-0" />}
          {type === "youtube" && <Youtube className="w-4 h-4 text-error shrink-0" />}
          {type === "web" && <Globe className="w-4 h-4 text-success shrink-0" />}
          {type === "vtt" && <FileCode className="w-4 h-4 text-accent shrink-0" />}
          {type === "text" && <AlignLeft className="w-4 h-4 text-secondary shrink-0" />}

          <span className="font-display font-medium text-body text-text truncate">
            {title}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content Viewer */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type-Specific Viewer Header */}
        <div className="p-3 rounded-xl bg-surface border border-border/40 text-mono-sm flex items-center justify-between text-text-muted">
          <span>Type: {type.toUpperCase()}</span>
          {type === "pdf" && <span>Page: {page}</span>}
          {type === "youtube" && <span>Timestamp: {timestamp}s</span>}
          {type === "vtt" && <span>Time: {timestamp}s</span>}
        </div>

        {/* Viewer Representation */}
        {type === "youtube" ? (
          <div className="space-y-3">
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border relative flex items-center justify-center">
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
            <div className="text-body-sm text-text-muted flex items-center justify-between">
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
        ) : type === "pdf" ? (
          <div className="space-y-3">
            <div className="h-64 bg-surface rounded-xl border border-border p-4 flex flex-col justify-between overflow-y-auto">
              <div className="text-mono-sm text-primary mb-2 font-semibold">
                PDF Document — Scrolled to Page {page}
              </div>
              <div className="text-body-sm text-text bg-accent/10 border-l-2 border-accent p-3 rounded-r-md">
                "{snippet}"
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
              <div className="text-mono-sm text-text-muted border-b border-border/30 pb-2">
                Cited Text Passage Highlight:
              </div>
              <div className="text-body-sm text-text bg-accent/15 border-l-2 border-accent p-3 rounded-r-md leading-relaxed font-body">
                "{snippet || "Passage content excerpt referenced by answer."}"
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
