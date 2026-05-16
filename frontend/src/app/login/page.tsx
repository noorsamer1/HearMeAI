"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAccount } from "@/lib/api/authApi";
import { getPostAuthRedirectPath } from "@/lib/session/recentSessions";
import { Button } from "@/components/common/Button";
import AuthScaffold from "@/components/auth/AuthScaffold";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const emailError = touched.email && !/^\S+@\S+\.\S+$/.test(email.trim()) ? "Enter a valid email address." : null;
  const passwordError = touched.password && password.length < 8 ? "Password must be at least 8 characters." : null;
  const canSubmit = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 8,
    [email, password]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await loginAccount(email.trim(), password);
      router.replace(getPostAuthRedirectPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to access sessions, matchmaking, and your communication workspace."
      switchText="Don't have an account?"
      switchAction="Create one"
      switchHref="/signup"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
              autoComplete="email"
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
              autoComplete="current-password"
              required
              minLength={8}
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

        {error && (
          <div
            className="rounded-xl border border-[var(--color-error-muted)] bg-[var(--color-error-bg)] px-3 py-2 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" isLoading={loading} disabled={!canSubmit} className="mt-2 h-11 w-full">
          Sign in
        </Button>
      </form>
    </AuthScaffold>
  );
}
