"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { NewNotebookModal } from "@/components/dashboard/new-notebook-modal";
import { Plus, Search, BookOpen, Trash2, FileText, Sparkles, Clock } from "lucide-react";

interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotebooks = async () => {
    try {
      const res = await fetch("/api/notebooks");
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data.notebooks || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async (title: string) => {
    const res = await fetch("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      await fetchNotebooks();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this notebook?")) return;
    const res = await fetch(`/api/notebooks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
    }
  };

  const filtered = notebooks.filter((nb) =>
    nb.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-display-md text-text">
              Your Notebooks
            </h1>
            <p className="text-body-sm text-text-muted">
              Select a notebook to query grounded sources or start a new workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search notebooks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-body-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition-all duration-fast"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all duration-fast shadow-glow flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Notebook
            </button>
          </div>
        </div>

        {/* Notebooks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 bg-surface rounded-2xl border border-border/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center glass rounded-2xl border border-border/40 my-8">
            <div className="w-16 h-16 rounded-2xl gradient-signature flex items-center justify-center text-white mb-4 shadow-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="font-display text-display-md text-text mb-2">
              {search ? "No matching notebooks" : "Nothing here yet"}
            </h2>
            <p className="text-body-sm text-text-muted max-w-md mb-6">
              {search
                ? "Try searching for a different keyword or clear your filter."
                : "Create your first notebook and add sources (PDF, YouTube, Web, Text, VTT) to start asking grounded questions."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all duration-fast shadow-glow flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create First Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* New Notebook Interactive Card */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="group h-48 border-2 border-dashed border-border hover:border-primary/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-base hover:bg-surface/50 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform duration-base group-hover:rotate-90">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-body text-text">
                  New Notebook
                </div>
                <div className="text-mono-sm text-text-muted">
                  Click to add workspace
                </div>
              </div>
            </button>

            {/* Notebook Cards */}
            {filtered.map((nb) => (
              <Link
                key={nb.id}
                href={`/notebook/${nb.id}`}
                className="group relative h-48 bg-surface rounded-2xl border border-border/40 p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-base overflow-hidden"
              >
                {/* Decorative subtle top swatch */}
                <div className="absolute top-0 left-0 right-0 h-1.5 gradient-signature opacity-60 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display font-medium text-body-lg text-text group-hover:text-primary transition-colors line-clamp-2">
                      {nb.title}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(nb.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-error/10 hover:text-error text-text-muted transition-all"
                      title="Delete notebook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-body-sm text-text-muted border-t border-border/30 pt-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Workspace</span>
                  </div>
                  <div className="flex items-center gap-1 text-mono-sm">
                    <Clock className="w-3 h-3" />
                    {new Date(nb.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <NewNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
