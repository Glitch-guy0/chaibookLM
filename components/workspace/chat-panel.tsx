"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Source } from "./sidebar";

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  pageNumber?: number;
  timestampStart?: number;
  text: string;
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

  // Function to render text with interactive citation chips [1], [2]
  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.role === "user") {
      return <p className="whitespace-pre-wrap">{msg.content}</p>;
    }

    const regex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(msg.content)) !== null) {
      const citationNum = parseInt(match[1], 10);
      const textBefore = msg.content.substring(lastIndex, match.index);
      if (textBefore) parts.push(textBefore);

      const citationData = msg.citations?.[citationNum - 1];

      parts.push(
        <button
          key={`cit_${match.index}`}
          onClick={() => citationData && onCitationClick(citationData)}
          className="inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 rounded-md bg-accent/20 hover:bg-accent/40 border border-accent/30 text-accent text-mono-sm font-semibold transition-all duration-fast hover:scale-105 active:scale-95 cursor-pointer"
          title={
            citationData
              ? `Click to view source: ${citationData.sourceTitle}`
              : `Citation ${citationNum}`
          }
        >
          [{citationNum}]
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < msg.content.length) {
      parts.push(msg.content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.length > 0 ? parts : msg.content}
        {msg.isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
        )}
      </div>
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
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white font-bold"
                    : "gradient-signature text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
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
