"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  FileText,
  Github,
  GraduationCap,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

const PLACEHOLDER = "[TBD]";

const INSTITUTION: { label: string; value: string }[] = [
  { label: "University", value: "[University Name]" },
  { label: "Faculty / Department", value: "[Department]" },
  { label: "Program / Course", value: "[Program / Course]" },
  { label: "Supervisor", value: "[Supervisor Name, Title]" },
  { label: "Academic Year", value: "[YYYY–YYYY]" },
  { label: "Project Type", value: "Graduation / Capstone Project" },
];

const TEAM: { role: string; name: string }[] = [
  { role: "Project lead", name: "[Your Name]" },
  { role: "Frontend", name: "[Name(s)]" },
  { role: "Backend", name: "[Name(s)]" },
  { role: "AI / Models", name: "[Name(s)]" },
  { role: "Accessibility advisor", name: PLACEHOLDER },
];

type Resource = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

const RESOURCES: Resource[] = [
  {
    label: "Frontend on GitHub",
    href: "https://github.com/noorsamer1/HearMeAI",
    icon: Github,
    external: true,
  },
  {
    label: "Design Documentation",
    href: "/UI_FRONTEND_FULL_OVERVIEW.md",
    icon: BookOpen,
  },
  {
    label: "Contact",
    href: "mailto:hello@hearmeai.example",
    icon: Mail,
  },
  {
    label: "Project Report (PDF)",
    href: "#",
    icon: FileText,
  },
];

export default function AcademicSection() {
  const reduceMotion = useSafeReducedMotion();

  return (
    <section
      id="academic"
      aria-labelledby="academic-heading"
      className="relative py-24 sm:py-28 bg-[var(--color-surface)] border-t border-[var(--color-border)]"
    >
      <div className="container relative z-10 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full surface-glass-light px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-text-secondary)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border-strong)]" />
            Academic Project
          </motion.span>

          <motion.h2
            id="academic-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-3xl md:text-4xl font-semibold font-heading tracking-tight text-[var(--color-text-primary)]"
          >
            Built as part of{" "}
            <span className="text-[var(--color-text-primary)]">
              [Program / Course Name]
            </span>{" "}
            at{" "}
            <span className="text-gradient">[University Name]</span>.
          </motion.h2>
        </div>

        <div className="mt-14 grid lg:grid-cols-2 gap-6">
          <CreditCard
            heading="Institution & Project"
            icon={Building2}
            rows={INSTITUTION.map((row) => ({
              label: row.label,
              value: row.value,
            }))}
            reduceMotion={!!reduceMotion}
          />
          <CreditCard
            heading="Team"
            icon={GraduationCap}
            rows={TEAM.filter((row) => row.name !== PLACEHOLDER).map((row) => ({
              label: row.role,
              value: row.name,
            }))}
            reduceMotion={!!reduceMotion}
          />
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {RESOURCES.map((resource) => (
              <li key={resource.label}>
                <ResourceLink resource={resource} />
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
            Replace bracketed placeholders before public release.
          </p>
        </div>

        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} HearMeAI · Built with care for accessibility
        </p>
      </div>
    </section>
  );
}

function CreditCard({
  heading,
  icon: Icon,
  rows,
  reduceMotion,
}: {
  heading: string;
  icon: LucideIcon;
  rows: { label: string; value: string }[];
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-7 shadow-sm"
    >
      <header className="flex items-center gap-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{heading}</h3>
      </header>

      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-[var(--color-text-tertiary)] uppercase tracking-[0.18em] text-[11px] sm:pt-0.5">
              {row.label}
            </dt>
            <dd className="text-[var(--color-text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </motion.article>
  );
}

function ResourceLink({ resource }: { resource: Resource }) {
  const Icon = resource.icon;
  return (
    <a
      href={resource.href}
      target={resource.external ? "_blank" : undefined}
      rel={resource.external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
    >
      <Icon className="w-4 h-4" aria-hidden />
      {resource.label}
      <ArrowUpRight className="w-3.5 h-3.5 opacity-70" aria-hidden />
    </a>
  );
}

