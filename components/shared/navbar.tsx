"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { BookOpen, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40 px-6 py-3 transition-all duration-base">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-signature flex items-center justify-center text-text font-bold shadow-sm transition-transform duration-fast group-hover:scale-105">
            <BookOpen className="w-4 h-4 text-text" />
          </div>
          <span className="font-display font-medium text-lg tracking-tight text-text">
            chai<span className="text-primary font-semibold">bookLM</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-body-sm font-medium">
          <Link
            href="/"
            className="text-text-muted hover:text-text transition-colors duration-fast"
          >
            Overview
          </Link>
          <Link
            href="/#features"
            className="text-text-muted hover:text-text transition-colors duration-fast"
          >
            Features
          </Link>

          <SignedIn>
            <Link
              href="/dashboard"
              className="text-text-muted hover:text-text transition-colors duration-fast"
            >
              Dashboard
            </Link>
            <div className="pl-2 border-l border-border/50 flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="text-text-muted hover:text-text transition-colors duration-fast"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg bg-primary text-text font-medium text-body-sm hover:brightness-110 active:scale-95 transition-all duration-fast shadow-glow flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Started
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
