"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/state/sessionStore";

const HIGH_CONTRAST_STORAGE_KEY = "hearmeai-high-contrast";
const FONT_SIZE_STORAGE_KEY = "hearmeai-font-size";

export function useTheme() {
  const { language, isHighContrast, fontSize, setIsHighContrast, setFontSize } = useSessionStore();

  useEffect(() => {
    const savedContrast = window.localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
    if (savedContrast === "true") {
      setIsHighContrast(true);
    }

    const savedFontSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (savedFontSize === "normal" || savedFontSize === "large" || savedFontSize === "xlarge") {
      setFontSize(savedFontSize);
    }
  }, [setFontSize, setIsHighContrast]);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("high-contrast", isHighContrast);
    html.setAttribute("data-high-contrast", String(isHighContrast));
    window.localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-font-size", fontSize);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
  }, [fontSize]);
}
