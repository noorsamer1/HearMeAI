"use client";

import { useEffect, useState } from "react";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { Activity, Mic, FileText, Sparkles } from "lucide-react";
import { fetchDashboardStats } from "@/lib/api/authApi";
import { getStoredToken } from "@/lib/api/client";

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    total_sessions: number;
    total_messages: number;
    transcript_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      setError("Sign in to see your usage.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDashboardStats(token);
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load stats.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const sessions = stats?.total_sessions ?? 0;
  const messages = stats?.total_messages ?? 0;
  const transcripts = stats?.transcript_count ?? 0;

  return (
    <div className="p-8 md:p-12 w-full h-full overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-3 tracking-tight">Dashboard</h1>
        <p className="font-sans text-base leading-relaxed text-[var(--color-text-secondary)]">
          Overview of your sessions and saved activity from the database.
        </p>
      </motion.div>

      {error && (
        <p className="mb-6 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          {error}
        </p>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div
          variants={itemVariants}
          className="surface-card group relative cursor-default overflow-hidden rounded-[2rem] p-8 transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-[var(--color-border-focus)] hover:shadow-[var(--shadow-md)] object-cover"
        >
          <div className="absolute right-0 top-0 p-6 text-[var(--color-brand)] opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100">
            <Activity className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <div className="pointer-events-none absolute -inset-[100%] w-full bg-gradient-to-r from-transparent via-[var(--color-border)]/30 to-transparent opacity-0 group-hover:animate-[waveform_2s_ease-in-out_infinite]" />

          <p className="relative z-10 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Total sessions
          </p>
          <div className="relative z-10 text-5xl font-heading font-bold tracking-tight text-[var(--color-text-primary)] tabular-nums transition-colors drop-shadow-md group-hover:text-[var(--color-brand)]">
            {loading ? "—" : formatStat(sessions)}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="surface-card group relative cursor-default overflow-hidden rounded-[2rem] p-8 transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-[var(--color-accent-300)] hover:shadow-[var(--shadow-md)]"
        >
          <div className="absolute right-0 top-0 p-6 text-[var(--color-accent)] opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100">
            <Mic className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <p className="relative z-10 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Messages saved
          </p>
          <div className="relative z-10 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-muted)] bg-clip-text text-5xl font-heading font-bold tracking-tight text-transparent transition-all duration-500 group-hover:from-[var(--color-accent)] group-hover:to-[var(--color-brand-600)] tabular-nums">
            {loading ? "—" : formatStat(messages)}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="surface-card group relative cursor-default overflow-hidden rounded-[2rem] p-8 transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-[var(--color-success)] hover:shadow-[var(--shadow-md)]"
        >
          <div className="absolute right-0 top-0 p-6 text-[var(--color-success)] opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100">
            <FileText className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <p className="relative z-10 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Speech transcripts
          </p>
          <div className="relative z-10 text-5xl font-heading font-bold tracking-tight text-[var(--color-text-primary)] tabular-nums transition-colors duration-500 group-hover:text-[var(--color-success)]">
            {loading ? "—" : formatStat(transcripts)}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="surface-card group relative mt-10 flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] p-10 shadow-inner transition-colors duration-500 hover:border-[var(--color-border-strong)]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-brand-muted)] to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 animate-pulse bg-[var(--color-brand)] blur-3xl opacity-20 transition-opacity duration-700 group-hover:opacity-40" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:border-[var(--color-border-focus)]">
              <Sparkles className="h-8 w-8 text-[var(--color-text-muted)] transition-colors duration-500 group-hover:text-[var(--color-brand)]" />
            </div>
          </div>

          <h3 className="mb-3 text-2xl font-heading font-medium tracking-wide text-[var(--color-text-primary)]">
            Activity chart
          </h3>
          <p className="mb-8 max-w-md text-center font-sans text-sm leading-relaxed text-[var(--color-text-muted)]">
            Time-series charts can plug in here later. Your headline numbers above are live from your account.
          </p>

          <div className="surface-card relative flex items-center gap-3 overflow-hidden rounded-full px-6 py-3 transition-colors duration-500 group-hover:border-[var(--color-border-focus)]">
            <div className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-[var(--color-border)]/40 to-transparent group-hover:animate-[waveform_2s_ease-in-out_infinite]" />

            <div className="absolute h-2 w-2 animate-ping rounded-full bg-[var(--color-brand)] opacity-80" />
            <div className="relative z-10 h-2 w-2 rounded-full bg-[var(--color-brand-500)] shadow-[0_0_8px_var(--color-brand-glow)]" />
            <span className="relative z-10 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-brand)]">
              {loading ? "Loading…" : "Live counts"}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-grid)"></rect>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
