"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-border/40 bg-surface/50 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Laptop className="w-4 h-4 text-text-muted" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className="w-4 h-4 text-primary" />
    ) : (
      <Sun className="w-4 h-4 text-warning" />
    );
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Theme: ${theme?.toUpperCase()} (click to cycle light/dark/system)`}
      className="w-9 h-9 rounded-lg border border-border/50 bg-surface/80 hover:bg-surface text-text flex items-center justify-center transition-all duration-fast hover:scale-105 active:scale-95 shadow-sm"
    >
      {getIcon()}
    </button>
  );
}
