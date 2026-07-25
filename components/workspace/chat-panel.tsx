"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, BookOpen } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Source } from "./sidebar";
import { MarkdownRenderer } from "./markdown-renderer";

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  pageNumber?: number;
  timestampStart?: number;
  text: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

interface ChatPanelProps {
  notebookId: string;
  sources: Source[];
  onCitationClick: (citation: Citation) => void;
}

export function ChatPanel({
  notebookId,
  sources,
  onCitationClick,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessageText = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: userMessageText,
    };

    const assistantMsgId = `msg_${Date.now() + 1}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookId, question: userMessageText }),
      });

      if (!res.ok) throw new Error("RAG query failed");

      const citationsHeader = res.headers.get("X-Citations-Json");
      let parsedCitations: Citation[] = [];
      if (citationsHeader) {
        try {
          parsedCitations = JSON.parse(decodeURIComponent(citationsHeader));
        } catch {
          try {
            parsedCitations = JSON.parse(citationsHeader);
          } catch {}
        }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          streamedContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: streamedContent,
                    citations: parsedCitations,
                  }
                : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, isStreaming: false, citations: parsedCitations }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "Sorry, an error occurred while generating grounded response.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to render text with markdown and interactive citation chips [1], [2]
  const renderMessageContent = (msg: ChatMessage) => {
    return (
      <MarkdownRenderer
        content={msg.content}
        citations={msg.citations}
        onCitationClick={onCitationClick}
        isStreaming={msg.isStreaming}
        role={msg.role}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl gradient-signature flex items-center justify-center text-text mb-4 shadow-lg">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="font-display font-medium text-display-md text-text mb-2">
              Ask anything about your sources
            </h3>
            <p className="text-body-sm text-text-muted mb-6">
              {sources.length > 0
                ? `You have ${sources.length} active source(s). Ask a question below to receive grounded answers with clickable inline citations.`
                : "Add a source from the left sidebar to enable grounded Q&A."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                  msg.role === "user"
                    ? "bg-primary text-white font-bold"
                    : "gradient-signature text-white"
                }`}
              >
                {msg.role === "user" ? (
                  user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`p-4 rounded-2xl text-body text-text border ${
                  msg.role === "user"
                    ? "bg-surface-raised border-border/40 rounded-tr-none"
                    : "bg-surface/60 border-border/30 rounded-tl-none shadow-sm"
                }`}
              >
                {renderMessageContent(msg)}

                {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[hsl(215_25%_22%/0.4)] flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-text-muted flex items-center gap-1 font-medium mr-1">
                      <BookOpen className="w-3.5 h-3.5 text-accent" />
                      Sources ({msg.citations.length}):
                    </span>
                    {msg.citations.map((cit, idx) => (
                      <button
                        key={`cit_footer_${idx}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCitationClick(cit);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent/30 border border-accent/30 text-accent text-xs font-medium transition-all duration-fast hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                        title={`Click to view source: ${cit.sourceTitle}`}
                      >
                        <span className="font-mono font-bold text-[10px] px-1 py-0.5 rounded bg-accent/20">
                          [{idx + 1}]
                        </span>
                        <span className="truncate max-w-[150px] text-text font-medium">
                          {cit.sourceTitle}
                        </span>
                        {cit.pageNumber ? (
                          <span className="text-[10px] text-text-muted">
                            p.{cit.pageNumber}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Query Input Box */}
      <div className="p-4 border-t border-border/30 glass">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-2 bg-surface border border-border/60 rounded-2xl p-2 focus-within:border-primary transition-all shadow-md"
        >
          <textarea
            rows={1}
            placeholder={
              sources.length > 0
                ? "Ask a question about your uploaded sources..."
                : "Add a source to enable query input"
            }
            disabled={sources.length === 0 || isGenerating}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1 px-3 py-2 bg-transparent text-text text-body placeholder:text-text-muted/50 focus:outline-none resize-none max-h-32 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isGenerating || sources.length === 0}
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-glow disabled:opacity-40 disabled:pointer-events-none shrink-0 mb-0.5"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
