"use client";

import Link from "next/link";
import { Ear, Languages, Volume2, Zap } from "lucide-react";

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
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.12), transparent 45%), " +
            "radial-gradient(circle at 80% 75%, rgba(167,139,250,0.12), transparent 45%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-2">

          {/* ── Left panel (brand showcase) ── */}
          <section
            className="hidden lg:flex lg:flex-col lg:justify-between rounded-3xl p-8 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(12,18,32,0.8), rgba(23,32,53,0.6))",
              border: "1px solid rgba(34,211,238,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Glow orbs */}
            <div
              aria-hidden
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #22D3EE, transparent)" }}
            />
            <div
              aria-hidden
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }}
            />

            <div className="relative">
              {/* Logo mark */}
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0891B2, #6366F1)" }}
                >
                  <Zap className="w-5 h-5 text-white" aria-hidden />
                </div>
                <span className="text-xl font-bold font-heading">
                  HearMe<span style={{ color: "var(--color-brand)" }}>AI</span>
                </span>
              </div>

              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-6"
                style={{
                  border: "1px solid rgba(34,211,238,0.25)",
                  background: "rgba(34,211,238,0.08)",
                  color: "var(--color-brand)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                AI-Powered Communication
              </span>

              <h2 className="text-4xl font-bold font-heading leading-tight">
                Secure access for{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #22D3EE, #A78BFA)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  inclusive communication.
                </span>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Join live rooms, create sessions, and communicate with captions,
                voice, and bilingual support — all in real time.
              </p>
            </div>

            <div className="space-y-3 relative">
              <FeatureRow
                icon={<Ear className="h-4 w-4" aria-hidden />}
                text="Live captions for deaf and hard-of-hearing users"
                color="brand"
              />
              <FeatureRow
                icon={<Volume2 className="h-4 w-4" aria-hidden />}
                text="Natural voice playback for non-speaking users"
                color="accent"
              />
              <FeatureRow
                icon={<Languages className="h-4 w-4" aria-hidden />}
                text="English and Arabic support with RTL handling"
                color="warm"
              />
            </div>
          </section>

          {/* ── Right panel (form) ── */}
          <section
            className="w-full rounded-3xl p-6 shadow-2xl sm:p-8"
            style={{
              background: "rgba(12,18,32,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0891B2, #6366F1)" }}
              >
                <Zap className="w-4 h-4 text-white" aria-hidden />
              </div>
              <span className="font-bold">HearMe<span style={{ color: "var(--color-brand)" }}>AI</span></span>
            </div>

            <h1 className="text-3xl font-bold font-heading tracking-tight">{title}</h1>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              {switchText}{" "}
              <Link
                href={switchHref}
                className="font-medium hover:underline transition-colors"
                style={{ color: "var(--color-brand)" }}
              >
                {switchAction}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link
                href="/"
                className="hover:underline transition-colors"
                style={{ color: "var(--color-text-muted)" }}
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
  color,
}: {
  icon: React.ReactNode;
  text: string;
  color: "brand" | "accent" | "warm";
}) {
  const colorMap = {
    brand: { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.2)", icon: "rgba(34,211,238,0.8)" },
    accent: { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)", icon: "rgba(167,139,250,0.8)" },
    warm: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", icon: "rgba(251,191,36,0.8)" },
  };
  const c = colorMap[color];

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: "var(--color-text-secondary)",
      }}
    >
      <span
        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: c.bg, color: c.icon }}
      >
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
