"use client";

import { useEffect, useState, useRef } from "react";
import { WorkspaceHeader } from "@/components/shared/workspace-header";
import { Sidebar, Source } from "@/components/workspace/sidebar";
import { ChatPanel, Citation } from "@/components/workspace/chat-panel";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { CheckCircle2 } from "lucide-react";

export default function WorkspacePage({ params }: { params: { notebookId: string } }) {
  const notebookId = params.notebookId;
  const [notebookTitle, setNotebookTitle] = useState("Notebook Workspace");
  const [sources, setSources] = useState<Source[]>([]);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [recentlyIndexedId, setRecentlyIndexedId] = useState<string | null>(null);
  const prevSourcesRef = useRef<Source[]>([]);
  const isFirstLoadRef = useRef<boolean>(true);

  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/sources/status?notebookId=${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        const newSources: Source[] = data.sources || [];

        if (!isFirstLoadRef.current) {
          // Detect any source that transitioned from indexing -> ready
          const prevSources = prevSourcesRef.current;
          const newlyCompleted = newSources.find((ns) => {
            const old = prevSources.find((os) => os.id === ns.id);
            return (
              ns.status === "ready" &&
              (!old || old.status === "indexing" || old.status === "uploading")
            );
          });

          if (newlyCompleted) {
            setStatusToast(`✨ "${newlyCompleted.title}" indexing complete! Ready for Q&A.`);
            setRecentlyIndexedId(newlyCompleted.id);

            setTimeout(() => {
              setStatusToast(null);
            }, 5000);

            setTimeout(() => {
              setRecentlyIndexedId(null);
            }, 6000);
          }
        } else {
          isFirstLoadRef.current = false;
        }

        prevSourcesRef.current = newSources;
        setSources(newSources);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notebookId) {
      fetchSources();
    }
  }, [notebookId]);

  // Polling loop every 1000ms while any source is uploading or indexing
  useEffect(() => {
    const hasPending = sources.some(
      (s) => s.status === "indexing" || s.status === "uploading"
    );

    if (hasPending) {
      const interval = setInterval(() => {
        fetchSources();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sources, notebookId]);

  const handleCitationClick = (citation: Citation) => {
    setActiveSource(null);
    setActiveCitation({ ...citation });
  };

  const handleSourceSelect = (source: Source) => {
    setActiveCitation(null);
    setActiveSource({ ...source });
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden relative">
      <WorkspaceHeader notebookTitle={notebookTitle} />

      {/* Floating Status Toast Notification */}
      {statusToast && (
        <div className="absolute top-14 right-6 z-50 p-4 px-5 rounded-2xl bg-success text-white font-medium text-body-sm shadow-2xl flex items-center gap-3 animate-fade-up border border-white/20">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Sources Sidebar */}
        <Sidebar
          notebookId={notebookId}
          notebookTitle={notebookTitle}
          sources={sources}
          onRefresh={fetchSources}
          onSelectSource={handleSourceSelect}
          activeSourceId={activeSource?.id}
          recentlyIndexedId={recentlyIndexedId}
        />

        {/* Center Column: Chat Thread & Query Input */}
        <ChatPanel
          notebookId={notebookId}
          sources={sources}
          onCitationClick={handleCitationClick}
        />

        {/* Right Column: Source Preview Panel (opens on demand) */}
        <PreviewPanel
          key={
            activeCitation
              ? `cit_${activeCitation.sourceId}_${activeCitation.chunkIndex ?? 0}_${Date.now()}`
              : activeSource
              ? `src_${activeSource.id}`
              : "panel_closed"
          }
          activeCitation={activeCitation}
          activeSource={activeSource}
          onClose={() => {
            setActiveCitation(null);
            setActiveSource(null);
          }}
        />
      </main>
    </div>
  );
}
