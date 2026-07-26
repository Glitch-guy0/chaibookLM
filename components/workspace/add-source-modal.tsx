"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Youtube,
  Globe,
  FileCode,
  AlignLeft,
  X,
  Upload,
  Loader2,
} from "lucide-react";

interface AddSourceModalProps {
  isOpen: boolean;
  notebookId: string;
  onClose: () => void;
  onAdded: () => void;
}

type SourceType = "pdf" | "youtube" | "web" | "text" | "vtt" | null;

export function AddSourceModal({
  isOpen,
  notebookId,
  onClose,
  onAdded,
}: AddSourceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<SourceType>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side hydration check for Portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleReset = () => {
    setSelectedType(null);
    setTitle("");
    setUrl("");
    setTextContent("");
    setFile(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("notebookId", notebookId);
      formData.append("sourceType", selectedType);
      formData.append("title", title || file?.name || url || "Uploaded Source");

      if (file) {
        formData.append("file", file);
      }
      if (url) {
        formData.append("url", url);
      }
      if (textContent) {
        formData.append("textContent", textContent);
      }

      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload source");
      }

      onAdded();
      handleClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto glass rounded-2xl border border-border/40 p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="font-display text-display-md text-text mb-1">
          Add Source to Notebook
        </h2>
        <p className="text-body-sm text-text-muted mb-6">
          Supported: PDF (.pdf), YouTube URL, Web Article, Plain Text, or VTT Transcript. Max 5MB per file.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-body-sm">
            {error}
          </div>
        )}

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedType("pdf")}
              className="group p-5 bg-surface border border-border hover:border-primary/80 rounded-xl flex flex-col items-start gap-3 transition-all hover:-translate-y-0.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">PDF Document</div>
                <div className="text-mono-sm text-text-muted">Max 5MB (.pdf)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("youtube")}
              className="group p-5 bg-surface border border-border hover:border-primary/80 rounded-xl flex flex-col items-start gap-3 transition-all hover:-translate-y-0.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">YouTube Video</div>
                <div className="text-mono-sm text-text-muted">Video link & transcript</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("text")}
              className="group p-5 bg-surface border border-border hover:border-primary/80 rounded-xl flex flex-col items-start gap-3 transition-all hover:-translate-y-0.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlignLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">Plain Text</div>
                <div className="text-mono-sm text-text-muted">Paste notes or text</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("vtt")}
              className="group p-5 bg-surface border border-border hover:border-primary/80 rounded-xl flex flex-col items-start gap-3 transition-all hover:-translate-y-0.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">VTT Subtitles</div>
                <div className="text-mono-sm text-text-muted">Transcript timeline (.vtt)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType("web")}
              className="group col-span-2 p-5 bg-surface border border-border hover:border-primary/80 rounded-xl flex items-center gap-4 transition-all hover:-translate-y-0.5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">Web Article / Link</div>
                <div className="text-mono-sm text-text-muted">Extract main text from URL</div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-2">
              <span className="text-body-sm font-medium text-primary uppercase tracking-wider">
                Type: {selectedType.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="text-mono-sm text-text-muted hover:text-text underline cursor-pointer"
              >
                Change type
              </button>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text mb-1">
                Source Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4 System Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-text text-body placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
              />
            </div>

            {(selectedType === "pdf" || selectedType === "vtt") && (
              <div>
                <label className="block text-body-sm font-medium text-text mb-1">
                  Upload File (Max 5MB)
                </label>
                <input
                  type="file"
                  accept={selectedType === "pdf" ? ".pdf" : ".vtt"}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-surface border border-dashed border-border rounded-lg text-body-sm text-text file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/20 file:text-primary file:font-medium"
                />
              </div>
            )}

            {(selectedType === "youtube" || selectedType === "web") && (
              <div>
                <label className="block text-body-sm font-medium text-text mb-1">
                  URL Endpoint
                </label>
                <input
                  type="url"
                  placeholder={
                    selectedType === "youtube"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://example.com/article"
                  }
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-text text-body placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            )}

            {selectedType === "text" && (
              <div>
                <label className="block text-body-sm font-medium text-text mb-1">
                  Text Content
                </label>
                <textarea
                  rows={5}
                  placeholder="Paste your raw research notes here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full p-3.5 bg-surface border border-border rounded-lg text-text text-body placeholder:text-text-muted/50 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-text-muted hover:text-text text-body-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-primary text-text font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all shadow-glow disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload & Index
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
