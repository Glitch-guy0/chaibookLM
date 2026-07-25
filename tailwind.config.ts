import type { Config } from "tailwindcss";

function colorRole(name: string) {
  return {
    tint: `hsl(var(--${name}-h) var(--${name}-s) calc(var(--${name}-l) + 20%))`,
    DEFAULT: `hsl(var(--${name}-h) var(--${name}-s) var(--${name}-l))`,
    shade: `hsl(var(--${name}-h) var(--${name}-s) calc(var(--${name}-l) - 20%))`,
  };
}

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colorRole("primary"),
        secondary: colorRole("secondary"),
        accent: colorRole("accent"),
        success: colorRole("success"),
        warning: colorRole("warning"),
        error: colorRole("error"),

        bg: "hsl(var(--bg-h) var(--bg-s) var(--bg-l))",
        surface: {
          DEFAULT: "hsl(var(--surface-h) var(--surface-s) var(--surface-l))",
          raised: "hsl(var(--surface-h) var(--surface-s) calc(var(--surface-l) - 4%))",
        },
        text: {
          DEFAULT: "hsl(var(--text-h) var(--text-s) var(--text-l))",
          muted: "hsl(var(--text-muted-h) var(--text-muted-s) var(--text-muted-l))",
        },
        border: "hsl(var(--text-h) var(--text-s) var(--text-l) / 0.1)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.05", fontWeight: "500" }],
        "display-lg": ["2.75rem", { lineHeight: "1.1", fontWeight: "500" }],
        "display-md": ["1.75rem", { lineHeight: "1.2", fontWeight: "500" }],
        "body-lg": ["1.125rem", { lineHeight: "1.5" }],
        body: ["0.9375rem", { lineHeight: "1.5" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.4" }],
        "mono-sm": ["0.75rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        lg: "12px",
        "2xl": "20px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "220ms",
        slow: "400ms",
      },
      boxShadow: {
        sm: "0 1px 2px hsl(var(--shadow-color) / 0.06)",
        md: "0 4px 16px hsl(var(--shadow-color) / 0.08)",
        lg: "0 12px 32px hsl(var(--shadow-color) / 0.12)",
        glow: "0 0 24px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms var(--ease-out) both",
        "slide-in-right": "slide-in-right 220ms var(--ease-in-out) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
