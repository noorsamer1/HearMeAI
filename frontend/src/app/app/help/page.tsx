import { Mail, BookOpen } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center p-8 md:p-12">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-heading font-bold text-[var(--color-text-primary)]">
          Help &amp; Support
        </h1>
        <p className="mx-auto max-w-md font-sans text-sm text-[var(--color-text-muted)]">
          Need assistance navigating the HearME AI interface? We&apos;re here to help ensure seamless
          accessibility.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass-card group cursor-pointer rounded-3xl border border-[var(--color-border)] border-t-[color-mix(in_srgb,var(--color-brand)_80%,transparent)] p-8 text-center transition-colors hover:bg-[var(--color-bg-subtle)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-muted)] transition-transform group-hover:scale-110">
            <BookOpen className="h-8 w-8 text-[var(--color-brand)]" />
          </div>
          <h3 className="mb-2 font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Documentation
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Read guides on managing your communication profile and testing microphones.
          </p>
        </div>

        <div className="glass-card group cursor-pointer rounded-3xl border border-[var(--color-border)] border-t-accent/80 p-8 text-center transition-colors hover:bg-[var(--color-bg-subtle)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-muted)] transition-transform group-hover:scale-110">
            <Mail className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="mb-2 font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Contact Accessibility Team
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Dedicated 24/7 text support for account or billing issues.
          </p>
        </div>
      </div>
    </div>
  );
}
