"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { registerAccount } from "@/lib/api/authApi";
import { getPostAuthRedirectPath } from "@/lib/session/recentSessions";
import { Button } from "@/components/common/Button";
import AuthScaffold from "@/components/auth/AuthScaffold";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<"deaf" | "mute" | "both" | "normal">("deaf");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{
    displayName?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const displayNameError =
    touched.displayName && displayName.trim().length < 2
      ? "Display name should be at least 2 characters."
      : null;
  const emailError = touched.email && !/^\S+@\S+\.\S+$/.test(email.trim()) ? "Enter a valid email address." : null;
  const passwordError = touched.password && password.length < 8 ? "Password must be at least 8 characters." : null;
  const confirmPasswordError =
    touched.confirmPassword && confirmPassword !== password ? "Passwords do not match." : null;

  const canSubmit = useMemo(
    () =>
      displayName.trim().length >= 2 &&
      /^\S+@\S+\.\S+$/.test(email.trim()) &&
      password.length >= 8 &&
      confirmPassword === password,
    [displayName, email, password, confirmPassword]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      displayName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await registerAccount({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
        user_type: userType,
        locale: "en",
      });
      router.replace(getPostAuthRedirectPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Choose your communication profile and start joining live sessions."
      switchText="Already have an account?"
      switchAction="Sign in"
      switchHref="/login"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Display name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden
            />
            <input
              id="name"
              required
              minLength={2}
              maxLength={120}
              value={displayName}
              onBlur={() => setTouched((s) => ({ ...s, displayName: true }))}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={!!displayNameError}
              className="input-field rounded-xl py-3 pl-10 pr-4"
              placeholder="Your name"
            />
          </div>
          {displayNameError && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{displayNameError}</p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
            I am joining as
          </span>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {[
              { value: "deaf",   label: "Deaf / HOH",      desc: "Reads captions & signs" },
              { value: "mute",   label: "Non-speaking",    desc: "Types & hears via TTS" },
              { value: "both",   label: "Deaf & Mute",     desc: "Sign keyboard only" },
              { value: "normal", label: "Normal",           desc: "Mic, TTS & all features" },
            ].map((option) => {
              const active = userType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserType(option.value as typeof userType)}
                  className={`rounded-xl border px-3 py-2.5 text-sm text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)] ${
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-muted)] text-[var(--color-brand-900)] shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-300)]"
                  }`}
                >
                  <span className="block font-medium leading-tight">{option.label}</span>
                  <span className="block text-xs mt-0.5 opacity-70 leading-snug">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden
            />
            <input
              id="email"
              type="email"
              required
              value={email}
              onBlur={() => setTouched((s) => ({ ...s, email: true }))}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
              className="input-field rounded-xl py-3 pl-10 pr-4"
              placeholder="you@example.com"
            />
          </div>
          {emailError && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{emailError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              value={password}
              onBlur={() => setTouched((s) => ({ ...s, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
              className="input-field rounded-xl py-3 pl-10 pr-12"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{passwordError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onBlur={() => setTouched((s) => ({ ...s, confirmPassword: true }))}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={!!confirmPasswordError}
            className="input-field rounded-xl px-4 py-3"
            placeholder="Re-enter password"
          />
          {confirmPasswordError && (
            <p className="mt-1 text-xs text-[var(--color-error)]">{confirmPasswordError}</p>
          )}
        </div>

        {error && (
          <div
            className="rounded-xl border border-[var(--color-error-muted)] bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" isLoading={loading} disabled={!canSubmit} className="mt-2 h-11 w-full">
          Create account
        </Button>
      </form>
    </AuthScaffold>
  );
}
