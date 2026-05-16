"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { Menu, Mic, X } from "lucide-react";
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
      className={`fixed top-0 left-0 right-0 z-[var(--z-sticky)] transition-all duration-300 ${
        isScrolled ? "nav-blur py-3" : "nav-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group" aria-label="HearMeAI home">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[var(--shadow-brand)]">
            <Mic className="w-5 h-5 text-[var(--color-text-inverse)]" aria-hidden />
            <span
              className={`pointer-events-none absolute inset-0 rounded-xl bg-[color-mix(in_srgb,var(--color-text-inverse)_25%,transparent)] blur-md ${
                reduceMotion ? "opacity-0" : "animate-pulse"
              }`}
            />
          </span>
          <span className="text-xl font-bold font-heading text-[var(--color-text-primary)] tracking-tight">
            HearMe<span className="text-[var(--color-brand)]">AI</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8" role="list">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="listitem"
              className="rounded text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/auth"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)] md:inline-block"
          >
            Sign In
          </a>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
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
          className="fixed inset-0 z-[var(--z-modal)] lg:hidden"
        >
          <div
            className="absolute inset-0 bg-[var(--color-text-primary)]/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto h-full w-full max-w-xs border-l border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[var(--color-text-primary)]">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid place-items-center w-9 h-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]"
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
                    className="block rounded-lg px-3 py-3 text-base text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-[var(--color-border)]">
              <a
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 py-3 text-center font-medium text-[var(--color-text-primary)]"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
