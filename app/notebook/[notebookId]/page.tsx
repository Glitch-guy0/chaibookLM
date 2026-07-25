"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/router";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar, Source } from "@/components/workspace/sidebar";
import { ChatPanel, Citation } from "@/components/workspace/chat-panel";
import { PreviewPanel } from "@/components/workspace/preview-panel";

export default function WorkspacePage({ params }: { params: { notebookId: string } }) {
  const notebookId = params.notebookId;
  const [notebookTitle, setNotebookTitle] = useState("Notebook Workspace");
  const [sources, setSources] = useState<Source[]>([]);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    try {
      const res = await fetch(`/api/sources/status?notebookId=${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
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

  const handleCitationClick = (citation: Citation) => {
    setActiveSource(null);
    setActiveCitation(citation);
  };

  const handleSourceSelect = (source: Source) => {
    setActiveCitation(null);
    setActiveSource(source);
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Navbar />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Sources Sidebar */}
        <Sidebar
          notebookId={notebookId}
          notebookTitle={notebookTitle}
          sources={sources}
          onRefresh={fetchSources}
          onSelectSource={handleSourceSelect}
          activeSourceId={activeSource?.id}
        />

        {/* Center Column: Chat Thread & Query Input */}
        <ChatPanel
          notebookId={notebookId}
          sources={sources}
          onCitationClick={handleCitationClick}
        />

        {/* Right Column: Source Preview Panel (opens on demand) */}
        <PreviewPanel
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
