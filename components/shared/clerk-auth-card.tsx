"use client";

import { useEffect, useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useTheme } from "@/lib/theme-context";

interface ClerkAuthCardProps {
  mode: "sign-in" | "sign-up";
}

export function ClerkAuthCard({ mode }: ClerkAuthCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const appearance = {
    variables: {
      colorBackground: isDark ? "#1e293b" : "#ffffff",
      colorPrimary: "#3b82f6",
      colorText: isDark ? "#f1f5f9" : "#1e293b",
      colorTextSecondary: isDark ? "#94a3b8" : "#64748b",
      colorInputBackground: isDark ? "#0f172a" : "#f8fafc",
      colorInputText: isDark ? "#f1f5f9" : "#1e293b",
      colorNeutral: isDark ? "#334155" : "#e2e8f0",
      borderRadius: "10px",
      fontFamily: "var(--font-inter, Inter, sans-serif)",
    },
  };

  return mode === "sign-in" ? (
    <SignIn appearance={appearance} />
  ) : (
    <SignUp appearance={appearance} />
  );
}
