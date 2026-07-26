"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import {
  FileText,
  Youtube,
  Globe,
  FileCode,
  AlignLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"pdf" | "yt" | "web" | "text" | "vtt">("pdf");

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.18),rgba(255,255,255,0))]" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-primary/30 text-body-sm font-medium text-primary shadow-sm animate-fade-up">
            <Sparkles className="w-4 h-4" />
            Portfolio-Grade Grounded RAG AI Research Assistant
          </div>

          <h1 className="font-display text-display-xl text-text leading-none tracking-tight max-w-4xl mx-auto">
            Turn any source into an answer.
          </h1>

          <p className="text-body-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Upload a PDF, paste a link, drop a transcript — ask it anything.
            Receive 100% source-grounded answers with interactive, clickable citations.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-primary text-white font-medium text-body hover:brightness-110 active:scale-95 transition-all shadow-glow flex items-center gap-2"
            >
              Try it free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Signature Interactive Mini-Demo Card */}
          <div id="demo" className="pt-10 max-w-3xl mx-auto">
            <div className="p-1 rounded-2xl gradient-signature shadow-2xl">
              <div className="glass rounded-[14px] p-6 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2 font-display text-body-lg font-medium text-text">
                    <BookOpenIcon />
                    Live Indexing Demo
                  </div>
                  <span className="text-mono-sm text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    Real-time status
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={() => setActiveTab("pdf")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      activeTab === "pdf"
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/40 border-border/40 hover:bg-surface"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-mono-sm font-medium">PDF</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("yt")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      activeTab === "yt"
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/40 border-border/40 hover:bg-surface"
                    }`}
                  >
                    <Youtube className="w-5 h-5 text-error" />
                    <span className="text-mono-sm font-medium">YouTube</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("web")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      activeTab === "web"
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/40 border-border/40 hover:bg-surface"
                    }`}
                  >
                    <Globe className="w-5 h-5 text-success" />
                    <span className="text-mono-sm font-medium">Web</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("text")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      activeTab === "text"
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/40 border-border/40 hover:bg-surface"
                    }`}
                  >
                    <AlignLeft className="w-5 h-5 text-secondary" />
                    <span className="text-mono-sm font-medium">Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("vtt")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      activeTab === "vtt"
                        ? "bg-surface border-primary shadow-sm"
                        : "bg-surface/40 border-border/40 hover:bg-surface"
                    }`}
                  >
                    <FileCode className="w-5 h-5 text-accent" />
                    <span className="text-mono-sm font-medium">VTT</span>
                  </button>
                </div>

                <div className="p-4 bg-surface rounded-xl border border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning animate-indexing" />
                    <span className="text-body-sm font-medium text-text">
                      Indexing {activeTab.toUpperCase()} source into Qdrant collection...
                    </span>
                  </div>
                  <span className="text-mono-sm text-text-muted">Status: INDEXING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section id="features" className="py-16 px-6 border-t border-border/30 max-w-6xl mx-auto w-full space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display text-display-lg text-text">
            Works with what you already have
          </h2>
          <p className="text-body text-text-muted">
            Three steps from fragmented files to verified insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 glass rounded-2xl border border-border/40 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display text-display-md text-text">
              1. Add Any Source
            </h3>
            <p className="text-body-sm text-text-muted leading-relaxed">
              Upload PDFs, paste YouTube links, website URLs, or drop VTT transcripts into isolated notebooks.
            </p>
          </div>

          <div className="p-6 glass rounded-2xl border border-border/40 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold text-lg">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display text-display-md text-text">
              2. Watch Real-time Indexing
            </h3>
            <p className="text-body-sm text-text-muted leading-relaxed">
              Watch your source transition live from yellow pulsing indexing dot to green ready state.
            </p>
          </div>

          <div className="p-6 glass rounded-2xl border border-border/40 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-display-md text-text">
              3. Interactive Citations
            </h3>
            <p className="text-body-sm text-text-muted leading-relaxed">
              Click any inline citation chip `[1]` to jump straight to the cited PDF page or YouTube timestamp.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 px-6 text-center text-mono-sm text-text-muted">
        <p>© 2026 chaibookLM — Whiteport Design Studio (WDS) Methodology</p>
      </footer>
    </div>
  );
}

function BookOpenIcon() {
  return <Sparkles className="w-5 h-5 text-primary" />;
}
