"use client";

import Link from "next/link";
import { Ear, Languages, Volume2 } from "lucide-react";

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_45%)]"
      />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section className="hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                HearMeAI Authentication
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-tight">
                Secure access for inclusive communication.
              </h2>
              <p className="mt-4 max-w-md text-slate-300">
                Sign in to create rooms, join by code, and continue real-time conversations with captions, text-to-speech, and bilingual support.
              </p>
            </div>
            <div className="space-y-3">
              <FeatureRow
                icon={<Ear className="h-4 w-4" aria-hidden />}
                text="Live captions for deaf and hard-of-hearing users"
              />
              <FeatureRow
                icon={<Volume2 className="h-4 w-4" aria-hidden />}
                text="Natural voice playback for non-speaking users"
              />
              <FeatureRow
                icon={<Languages className="h-4 w-4" aria-hidden />}
                text="English and Arabic support with RTL handling"
              />
            </div>
          </section>

          <section className="w-full rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-slate-300">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-slate-400">
              {switchText}{" "}
              <Link href={switchHref} className="font-medium text-brand-300 hover:text-brand-200 hover:underline">
                {switchAction}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link href="/" className="text-slate-400 hover:text-slate-200 hover:underline">
                ← Back to landing page
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-brand-200">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
