"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface NewNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export function NewNotebookModal({
  isOpen,
  onClose,
  onCreate,
}: NewNotebookModalProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title);
      setTitle("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="w-full max-w-md glass rounded-2xl border border-border/40 p-6 shadow-2xl relative">
        <h2 className="font-display text-display-md text-text mb-2">
          Create New Notebook
        </h2>
        <p className="text-body-sm text-text-muted mb-6">
          Each notebook is an isolated workspace holding your sources & vector search index.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-text mb-1.5">
              Notebook Title
            </label>
            <input
              type="text"
              placeholder="e.g. AI Architecture Research 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-text text-body placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-all duration-fast"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-muted hover:text-text text-body-sm font-medium transition-colors duration-fast"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 rounded-lg bg-primary text-text font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all duration-fast shadow-glow disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Notebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
