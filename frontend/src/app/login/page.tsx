"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAccount } from "@/lib/api/authApi";
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
      router.replace("/lobby");
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
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onBlur={() => setTouched((s) => ({ ...s, email: true }))}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
              className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-10 pr-4 text-slate-100 outline-none transition focus:border-brand-400"
              placeholder="you@example.com"
            />
          </div>
          {emailError && <p className="mt-1 text-xs text-rose-300">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
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
              className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-10 pr-12 text-slate-100 outline-none transition focus:border-brand-400"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-rose-300">{passwordError}</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
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
