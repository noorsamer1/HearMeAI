import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── shadcn compat ── */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border:     "hsl(var(--border))",
        input:      "hsl(var(--border))",
        ring:       "hsl(var(--ring))",

        /* ── Brand: Cyan ── */
        brand: {
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },

        /* ── Accent: Violet ── */
        accent: {
          light:   "#C4B5FD",
          DEFAULT: "#A78BFA",
          dim:     "#7C3AED",
          dark:    "#5B21B6",
        },

        /* ── Warm: Amber ── */
        warm: {
          light:   "#FCD34D",
          DEFAULT: "#FBBF24",
          dark:    "#F59E0B",
        },

        /* ── Surfaces (theme tokens; prefers html[data-theme]) ─ */
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
          overlay: "var(--color-surface-overlay)",
        },

        /* ── Status ── */
        status: {
          idle:       "#475569",
          listening:  "#22D3EE",
          processing: "#A78BFA",
          speaking:   "#34D399",
        },

        /* ── Kept for backward compat ── */
        neon: {
          blue:   "#22D3EE",
          purple: "#A78BFA",
          green:  "#34D399",
          yellow: "#FBBF24",
        },
      },

      fontFamily: {
        sans: [
          "var(--font-inter)",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "var(--font-outfit)",
          "\"Segoe UI\"",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "\"JetBrains Mono\"",
          "\"Fira Code\"",
          "\"Cascadia Code\"",
          "\"Consolas\"",
          "monospace",
        ],
      },

      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blob":         "blob 7s infinite",
        "waveform":     "waveform 1.2s ease-in-out infinite",
        "typing-dot":   "typingDot 1.4s infinite ease-in-out both",
        "float":        "float 4s ease-in-out infinite",
        "glow-pulse":   "glow-pulse 2s ease-in-out infinite",
        "spin-slow":    "spin-slow 8s linear infinite",
        "shimmer":      "shimmer 1.4s ease infinite",
        "waveBar":      "waveBar 1s ease-in-out infinite",
      },

      keyframes: {
        waveform: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%":      { transform: "scaleY(1)" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%":      { transform: "scaleY(1)" },
        },
        blob: {
          "0%":   { transform: "translate(0px, 0px) scale(1)" },
          "33%":  { transform: "translate(30px, -50px) scale(1.1)" },
          "66%":  { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        typingDot: {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0" },
          "40%":           { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":   "linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)",
        "gradient-accent":  "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-warm":    "linear-gradient(135deg, #F59E0B 0%, #F87171 100%)",
        "gradient-surface": "linear-gradient(180deg, #0C1220 0%, #070B14 100%)",
        "mesh-cyan":        "radial-gradient(at 40% 20%, rgba(34,211,238,0.15) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(167,139,250,0.1) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(6,182,212,0.1) 0, transparent 50%)",
      },

      backdropBlur: {
        xs: "2px",
        sm: "6px",
        md: "12px",
        xl: "20px",
        "2xl": "32px",
      },

      boxShadow: {
        "card":          "0 4px 24px -8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset",
        "glow-cyan":     "0 0 32px rgba(34,211,238,0.25)",
        "glow-violet":   "0 0 32px rgba(167,139,250,0.25)",
        "glow-sm-cyan":  "0 0 16px rgba(34,211,238,0.2)",
        "glow-sm-violet":"0 0 16px rgba(167,139,250,0.2)",
        "float":         "0 20px 60px -12px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
