export default function PreferencesPage() {
  return (
    <div className="w-full max-w-4xl p-8 md:p-12">
      <h1 className="mb-2 text-3xl font-heading font-bold text-[var(--color-text-primary)]">
        Preferences
      </h1>
      <p className="mb-12 font-sans text-sm text-[var(--color-text-muted)]">
        Manage your communication and accessibility settings.
      </p>

      <div className="space-y-8">
        <div className="glass-card rounded-3xl border border-[var(--color-border)] p-8">
          <h2 className="mb-6 border-b border-[var(--color-border)] pb-4 font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Theme Settings
          </h2>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">High Contrast Mode</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Forces maximum WCAG compliant saturation.
              </p>
            </div>
            <div className="flex h-6 w-12 cursor-pointer items-center rounded-full bg-[var(--color-brand)] p-1">
              <div className="h-4 w-4 translate-x-6 rounded-full bg-[var(--color-surface)] shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Reduce Animation</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Disables non-essential motion graphics.
              </p>
            </div>
            <div className="flex h-6 w-12 cursor-pointer items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] p-1">
              <div className="h-4 w-4 rounded-full bg-[var(--color-text-muted)] shadow-sm" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl border border-[var(--color-border)] p-8">
          <h2 className="mb-6 border-b border-[var(--color-border)] pb-4 font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Translation Engine
          </h2>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Primary Language</p>
              <p className="text-sm text-[var(--color-text-muted)]">Your default communication dialect.</p>
            </div>
            <select className="input-field rounded-lg px-4 py-2 text-sm outline-none focus-visible:outline-none">
              <option>English (US)</option>
              <option>Arabic</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
