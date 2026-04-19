"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { registerAccount } from "@/lib/api/authApi";
import { Button } from "@/components/common/Button";
import AuthScaffold from "@/components/auth/AuthScaffold";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<"deaf" | "mute" | "both">("deaf");
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
      router.replace("/lobby");
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
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-200">
            Display name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="name"
              required
              minLength={2}
              maxLength={120}
              value={displayName}
              onBlur={() => setTouched((s) => ({ ...s, displayName: true }))}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={!!displayNameError}
              className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-10 pr-4 text-slate-100 outline-none transition focus:border-brand-400"
              placeholder="Your name"
            />
          </div>
          {displayNameError && <p className="mt-1 text-xs text-rose-300">{displayNameError}</p>}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-200">I am joining as</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { value: "deaf", label: "Deaf / HOH" },
              { value: "mute", label: "Non-speaking" },
              { value: "both", label: "Both" },
            ].map((option) => {
              const active = userType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserType(option.value as typeof userType)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    active
                      ? "border-brand-400 bg-brand-500/20 text-brand-100"
                      : "border-white/15 bg-black/20 text-slate-300 hover:border-white/30"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="email"
              type="email"
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
              minLength={8}
              required
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

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-200">
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
            className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400"
            placeholder="Re-enter password"
          />
          {confirmPasswordError && <p className="mt-1 text-xs text-rose-300">{confirmPasswordError}</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
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
