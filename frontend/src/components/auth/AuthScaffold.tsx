"use client";

import Link from "next/link";
import { Ear, Languages, Mic, Volume2 } from "lucide-react";

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  switchText: string;
  switchAction: string;
  switchHref: string;
  children: React.ReactNode;
};

export default function AuthScaffold({
  title,
  subtitle,
  switchText,
  switchAction,
  switchHref,
  children,
}: AuthScaffoldProps) {
  return (
    <div className="mesh-bg surface-page relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          {/* Left: brand panel (desktop) */}
          <section
            className="relative hidden overflow-hidden rounded-3xl border border-[var(--color-border-strong)] surface-glass-brand p-8 lg:flex lg:flex-col lg:justify-between"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] blur-3xl"
            />

            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[var(--shadow-brand)]">
                  <Mic className="h-5 w-5 text-[var(--color-text-inverse)]" aria-hidden />
                </div>
                <span className="text-xl font-bold font-heading text-[var(--color-text-primary)]">
                  HearMe<span className="text-[var(--color-brand)]">AI</span>
                </span>
              </div>

              <span className="badge badge-brand mb-6 inline-flex items-center gap-2 tracking-[0.18em]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                AI-Powered Communication
              </span>

              <h2 className="text-4xl font-bold font-heading leading-tight text-[var(--color-text-primary)]">
                Secure access for <span className="text-gradient">inclusive communication.</span>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-[var(--color-text-secondary)]">
                Join live rooms, create sessions, and communicate with captions,
                voice, and bilingual support — all in real time.
              </p>
            </div>

            <div className="relative space-y-3">
              <FeatureRow
                icon={<Ear className="h-4 w-4" aria-hidden />}
                text="Live captions for deaf and hard-of-hearing users"
                tone="brand"
              />
              <FeatureRow
                icon={<Volume2 className="h-4 w-4" aria-hidden />}
                text="Natural voice playback for non-speaking users"
                tone="accent"
              />
              <FeatureRow
                icon={<Languages className="h-4 w-4" aria-hidden />}
                text="English and Arabic support with RTL handling"
                tone="warm"
              />
            </div>
          </section>

          {/* Right: form */}
          <section className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-sm">
                <Mic className="h-4 w-4 text-[var(--color-text-inverse)]" aria-hidden />
              </div>
              <span className="font-bold text-[var(--color-text-primary)]">
                HearMe<span className="text-[var(--color-brand)]">AI</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold font-heading tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              {switchText}{" "}
              <Link
                href={switchHref}
                className="font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-dim)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] rounded"
              >
                {switchAction}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link
                href="/"
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)] rounded"
              >
                ← Back to landing page
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: "brand" | "accent" | "warm";
}) {
  const styles: Record<"brand" | "accent" | "warm", { row: string; iconWrap: string }> = {
    brand: {
      row: "border-[color-mix(in_srgb,var(--color-brand-200)_80%,transparent)] bg-[var(--color-brand-muted)]",
      iconWrap: "bg-[color-mix(in_srgb,var(--color-brand-100)_85%,var(--color-surface))] text-[var(--color-brand-dim)]",
    },
    accent: {
      row: "border-[color-mix(in_srgb,var(--color-accent-200)_80%,transparent)] bg-[var(--color-accent-muted)]",
      iconWrap:
        "bg-[color-mix(in_srgb,var(--color-accent-100)_85%,var(--color-surface))] text-[var(--color-accent-dim)]",
    },
    warm: {
      row: "border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[var(--color-warning-bg)]",
      iconWrap: "bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-surface))] text-[var(--color-warning)]",
    },
  };

  const s = styles[tone];

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-[var(--color-text-primary)] ${s.row}`}
    >
      <span
        className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${s.iconWrap}`}
      >
        {icon}
      </span>
      <span className="text-[var(--color-text-secondary)]">{text}</span>
    </div>
  );
}
