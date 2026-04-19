"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/state/sessionStore";

export function useTheme() {
  const { language, isHighContrast, fontSize } = useSessionStore();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-high-contrast", String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-font-size", fontSize);
  }, [fontSize]);
}
