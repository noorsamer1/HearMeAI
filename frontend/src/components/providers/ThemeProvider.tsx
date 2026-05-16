"use client";

import { useTheme } from "@/lib/hooks/useTheme";

/**
 * Applies language, font size, high contrast, and light/dark theme from session store + localStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}
