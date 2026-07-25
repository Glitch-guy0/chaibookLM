"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Youtube,
  Globe,
  FileCode,
  AlignLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AddSourceModal } from "./add-source-modal";

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: "pdf" | "text" | "vtt" | "youtube" | "web";
  urlOrPath: string;
  sizeBytes: number;
  status: "uploading" | "indexing" | "ready" | "failed";
  createdAt: string;
}

interface SidebarProps {
  notebookId: string;
  notebookTitle: string;
  sources: Source[];
  onRefresh: () => void;
  onSelectSource: (source: Source) => void;
  activeSourceId?: string;
  recentlyIndexedId?: string | null;
}

export function Sidebar({
  notebookId,
  notebookTitle,
  sources,
  onRefresh,
  onSelectSource,
  activeSourceId,
  recentlyIndexedId,
}: SidebarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getSourceIcon = (type: Source["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-primary shrink-0" />;
      case "youtube":
        return <Youtube className="w-4 h-4 text-error shrink-0" />;
      case "web":
        return <Globe className="w-4 h-4 text-success shrink-0" />;
      case "vtt":
        return <FileCode className="w-4 h-4 text-accent shrink-0" />;
      default:
        return <AlignLeft className="w-4 h-4 text-secondary shrink-0" />;
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this source from notebook?")) return;
    const res = await fetch(`/api/sources/status?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onRefresh();
    }
  };

  return (
    <aside className="w-80 shrink-0 glass border-r border-border/40 flex flex-col justify-between h-full select-none">
      <div className="p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Notebook Title & Add Source Button */}
        <div>
          <h2 className="font-display font-medium text-body-lg text-text truncate mb-3">
            {notebookTitle}
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all shadow-glow flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>

        {/* Source List Section */}
        <div>
          <div className="flex items-center justify-between text-mono-sm text-text-muted mb-2 px-1">
            <span>SOURCES ({sources.length})</span>
            <span>STATUS</span>
          </div>

          {sources.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-surface/50 border border-dashed border-border/60 my-2">
              <Sparkles className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
              <p className="text-body-sm text-text-muted">No sources yet.</p>
              <p className="text-mono-sm text-text-muted/70 mt-1">
                Add PDFs, links, or notes to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((src) => {
                const isActive = activeSourceId === src.id;
                const isJustCompleted = recentlyIndexedId === src.id;
                const isIndexing =
                  src.status === "indexing" || src.status === "uploading";
                const isReady = src.status === "ready";

                return (
                  <div
                    key={src.id}
                    onClick={() => onSelectSource(src)}
                    className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isJustCompleted
                        ? "bg-success/10 border-success shadow-glow"
                        : isActive
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/30 hover:bg-surface border-border/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                      {getSourceIcon(src.type)}
                      <div className="truncate">
                        <span className="text-body-sm font-medium text-text truncate block">
                          {src.title}
                        </span>
                        <span className="text-mono-sm text-text-muted capitalize">
                          {src.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Indicator Badge */}
                      {isIndexing ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 text-mono-sm font-medium animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Indexing</span>
                        </div>
                      ) : isReady ? (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-mono-sm font-medium transition-all ${
                            isJustCompleted
                              ? "bg-success text-white border-success scale-105"
                              : "bg-success/15 text-success border-success/30"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/15 text-error border border-error/30 text-mono-sm font-medium">
                          <span>Failed</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDelete(src.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-error text-text-muted transition-opacity"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border/30 text-mono-sm text-text-muted/70 flex items-center justify-between">
        <span>Capacity: {sources.length}/50</span>
      </div>

      <AddSourceModal
        isOpen={isAddModalOpen}
        notebookId={notebookId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={onRefresh}
      />
    </aside>
  );
}
