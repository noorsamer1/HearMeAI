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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          50: "#e0e7ff",
          100: "#c7d2fe",
          200: "#a5b4fc",
          300: "#818cf8",
          400: "#6366f1",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3",
          800: "#312e81",
          900: "#1e1b4b",
        },
        accent: {
          light: "#d8b4fe",
          DEFAULT: "#a855f7",
          dark: "#7e22ce",
        },
        neon: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          green: "#10b981",
          yellow: "#f59e0b",
        },
        surface: {
          DEFAULT: "#0f172a", // slate-900
          raised: "#1e293b",  // slate-800
          overlay: "rgba(30, 41, 59, 0.7)",
        },
        status: {
          idle: "#64748b",
          listening: "#3b82f6",
          processing: "#f59e0b",
          speaking: "#10b981",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "\"Segoe UI\"",
          "\"Segoe UI Emoji\"",
          "\"Apple Color Emoji\"",
          "\"Noto Color Emoji\"",
          "sans-serif",
        ],
        heading: [
          "var(--font-outfit)",
          "\"Segoe UI\"",
          "\"Segoe UI Emoji\"",
          "\"Apple Color Emoji\"",
          "\"Noto Color Emoji\"",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blob": "blob 7s infinite",
        waveform: "waveform 1.2s ease-in-out infinite",
        "typing-dot": "typingDot 1.4s infinite ease-in-out both",
      },
      keyframes: {
        waveform: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        typingDot: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      backdropBlur: {
        xs: "2px",
        md: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
