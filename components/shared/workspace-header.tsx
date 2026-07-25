"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface WorkspaceHeaderProps {
  notebookTitle?: string;
}

export function WorkspaceHeader({ notebookTitle }: WorkspaceHeaderProps) {
  return (
    <header className="h-12 shrink-0 z-50 flex items-center justify-between px-4 border-b border-[hsl(215_25%_22%/0.6)] bg-[hsl(var(--bg-h)_var(--bg-s)_var(--bg-l)/0.95)] backdrop-blur-md">
      {/* Left: Logo + back link */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 rounded-lg gradient-signature flex items-center justify-center shadow-sm transition-transform duration-100 group-hover:scale-105">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-medium text-base tracking-tight text-text hidden sm:block">
            chai<span className="text-primary font-semibold">bookLM</span>
          </span>
        </Link>

        <span className="text-text-muted/40 text-lg hidden sm:block">·</span>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-body-sm font-medium text-text-muted hover:text-text transition-colors duration-100 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-100 group-hover:-translate-x-0.5" />
          <span>Dashboard</span>
        </Link>

        {notebookTitle && (
          <>
            <span className="text-text-muted/40 text-sm">/</span>
            <span className="text-body-sm text-text-muted truncate max-w-48 hidden md:block">
              {notebookTitle}
            </span>
          </>
        )}
      </div>

      {/* Right: Theme toggle + user avatar */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
