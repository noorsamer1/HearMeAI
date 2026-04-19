"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { Menu, Mic, Play, X } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: "Problem", href: "#problem" },
  { label: "Features", href: "#features" },
  { label: "Accessibility", href: "#accessibility" },
  { label: "Mission", href: "#impact" },
  { label: "Academic", href: "#academic" },
];

export default function Navbar() {
  const reduceMotion = useSafeReducedMotion();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 40);
    });
  }, [scrollY]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      aria-label="Primary"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/85 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group" aria-label="HearMeAI home">
          <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Mic className="w-5 h-5 text-white" aria-hidden />
            <span
              className={`absolute inset-0 rounded-xl bg-white/20 blur-md pointer-events-none ${
                reduceMotion ? "opacity-0" : "animate-pulse"
              }`}
            />
          </span>
          <span className="text-xl font-bold font-heading text-white tracking-tight">
            HearMe<span className="text-brand-400">AI</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8" role="list">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="listitem"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 rounded"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/auth"
            className="hidden md:inline-block text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
          >
            Sign In
          </a>
          <a
            href="/app"
            className="relative group overflow-hidden rounded-full bg-white px-5 py-2.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:text-white transition-colors duration-300">
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
              Try Demo
            </span>
          </a>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass border border-white/10 text-slate-200"
          >
            <Menu className="w-5 h-5" aria-hidden />
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto h-full w-full max-w-xs bg-slate-950 border-l border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-100">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid place-items-center w-9 h-9 rounded-full glass border border-white/10 text-slate-200"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <ul className="mt-8 space-y-1">
              {NAV_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 rounded-lg text-base text-slate-200 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/5">
              <a
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="text-center px-4 py-3 rounded-full glass border border-white/10 text-slate-100"
              >
                Sign In
              </a>
              <a
                href="/app"
                onClick={() => setMobileOpen(false)}
                className="text-center px-4 py-3 rounded-full bg-white text-slate-900 font-semibold"
              >
                Try Demo
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
