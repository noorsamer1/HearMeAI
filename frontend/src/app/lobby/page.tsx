"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightCircle,
  CheckCircle2,
  CircleHelp,
  CircleAlert,
  Compass,
  DoorOpen,
  Ear,
  MessageSquare,
  Mic2,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getStoredToken } from "@/lib/api/client";
import { fetchMe, logoutAccount } from "@/lib/api/authApi";
import { createSession, joinSessionByCode, matchEnqueue, matchPoll } from "@/lib/api/sessionApi";
import {
  hasRecentSessions,
  readRecentSessions,
  RECENT_SESSION_KEY,
  RECENT_SESSIONS_KEY,
} from "@/lib/session/recentSessions";
import { Button } from "@/components/common/Button";

const ONBOARDING_KEY = "hearmeai-lobby-onboarding-complete";

type RecentSession = {
  sessionId: string;
  source: "create" | "join" | "match";
  at: number;
};

export default function LobbyPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"info" | "success" | "error">("info");
  const [createdRoom, setCreatedRoom] = useState<{ id: string; code: string } | null>(null);
  const [recentSession, setRecentSession] = useState<RecentSession | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const [inviteTouched, setInviteTouched] = useState(false);
  const [showBackToSessions, setShowBackToSessions] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createSectionRef = useRef<HTMLElement | null>(null);
  const joinSectionRef = useRef<HTMLElement | null>(null);
  const matchSectionRef = useRef<HTMLElement | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    setProfileLoading(true);
    fetchMe(t)
      .then((u) => {
        setDisplayName(u.display_name);
        setUserType(u.user_type);
        const completed = window.localStorage.getItem(ONBOARDING_KEY) === "1";
        if (!completed) setShowOnboarding(true);
        setShowBackToSessions(hasRecentSessions());
        try {
          const raw = window.localStorage.getItem(RECENT_SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as RecentSession;
            if (parsed?.sessionId) setRecentSession(parsed);
          }
        } catch {
          // ignore malformed local storage
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setProfileLoading(false));
  }, [router]);

  const normalizedInvite = invite.trim().toUpperCase();
  const inviteError =
    inviteTouched && normalizedInvite.length > 0 && !/^[A-Z0-9_]{4,32}$/.test(normalizedInvite)
      ? "Invite code must be 4-32 characters using letters, numbers, or underscore."
      : null;
  const canJoin = normalizedInvite.length > 0 && !inviteError && !busy;
  const profileLabels: Record<string, string> = {
    deaf: "Deaf",
    mute: "Mute",
    both: "Deaf & Mute",
    normal: "Normal",
  };
  const profileLabel = userType ? profileLabels[userType] ?? userType : "your profile";

  const suggestedPath = useMemo(() => {
    if (createdRoom) return "Copy the invite code and open the room when your partner is ready.";
    if (normalizedInvite) return `Paste the code and join — your ${profileLabel} profile controls the session UI.`;
    if (userType === "mute" || userType === "normal") {
      return "Suggested: matchmaking pairs you with a Deaf or Deaf & Mute partner.";
    }
    return "Suggested: create a room for demos, or join with an invite code.";
  }, [createdRoom, normalizedInvite, userType, profileLabel]);

  function persistRecentSession(sessionId: string, source: RecentSession["source"]) {
    const payload: RecentSession = { sessionId, source, at: Date.now() };
    setRecentSession(payload);
    window.localStorage.setItem(RECENT_SESSION_KEY, JSON.stringify(payload));
    const current = readRecentSessions();
    const next = [payload, ...current.filter((item) => item.sessionId !== sessionId)].slice(0, 12);
    window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
  }

  const startMatchPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const t = getStoredToken();
      if (!t) return;
      try {
        const p = await matchPoll(t);
        if (p.matched && p.session_id) {
          stopPolling();
          persistRecentSession(p.session_id, "match");
          router.push(`/chat/${p.session_id}`);
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
  };

  async function handleCreate() {
    if (!token) return;
    setBusy(true);
    setStatus(null);
    setStatusKind("info");
    setCreatedRoom(null);
    try {
      const s = await createSession(token, { mode: "direct" });
      if (s.invite_code) {
        setCreatedRoom({ id: s.id, code: s.invite_code });
        setStatus(null);
      } else {
        persistRecentSession(s.id, "create");
        router.push(`/chat/${s.id}`);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not create session");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!token || !normalizedInvite || inviteError) return;
    setBusy(true);
    setStatus(null);
    setStatusKind("info");
    try {
      const s = await joinSessionByCode(token, normalizedInvite);
      persistRecentSession(s.id, "join");
      router.push(`/chat/${s.id}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not join");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function handleMatch() {
    if (!token) return;
    setBusy(true);
    setStatus(null);
    setStatusKind("info");
    stopPolling();
    try {
      const r = await matchEnqueue(token);
      if (r.status === "matched" && r.session_id) {
        persistRecentSession(r.session_id, "match");
        router.push(`/chat/${r.session_id}`);
        return;
      }
      setStatus(
        "Waiting for a compatible partner (Deaf ↔ Mute/Normal). This page will open the room automatically when matched."
      );
      setStatusKind("info");
      startMatchPolling();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Match failed");
      setStatusKind("error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    stopPolling();
    await logoutAccount(token);
    router.replace("/login");
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Invite code copied.");
      setStatusKind("success");
    } catch {
      setStatus("Could not copy — select and copy manually.");
      setStatusKind("error");
    }
  }

  function finishOnboarding() {
    setShowOnboarding(false);
    window.localStorage.setItem(ONBOARDING_KEY, "1");
  }

  function clearRecentSession() {
    setRecentSession(null);
    window.localStorage.removeItem(RECENT_SESSION_KEY);
    window.localStorage.removeItem(RECENT_SESSIONS_KEY);
  }

  function jumpTo(section: "create" | "join" | "match") {
    const map = {
      create: createSectionRef.current,
      join: joinSectionRef.current,
      match: matchSectionRef.current,
    };
    map[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10 pb-28 md:pb-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Lobby</h1>
            {profileLoading ? (
              <div className="mt-2 h-4 w-48 rounded bg-[var(--color-border)]/60 animate-pulse" />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Signed in as {displayName || "…"}
                {userType ? ` · Profile: ${{ deaf: "Deaf", mute: "Mute", both: "Deaf & Mute", normal: "Normal" }[userType] ?? userType}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showBackToSessions && (
              <Link
                href="/app/sessions"
                className="text-sm text-[var(--color-brand)] hover:text-[var(--color-brand-dim)] hover:underline"
              >
                Back to sessions
              </Link>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>

        {showOnboarding && (
          <section className="rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] bg-[var(--color-brand-muted)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-brand-dim)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  First-time quick start
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
                  Welcome to the lobby, {displayName || "there"}.
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Complete one quick path to start your first conversation.
                </p>
              </div>
              <button
                type="button"
                onClick={finishOnboarding}
                className="rounded-lg p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Dismiss onboarding"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-2">
              {[
                "Create a room and share your invite code",
                "OR join with an invite code from a partner",
                "OR use matchmaking and wait for auto-join",
              ].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setOnboardingStep(idx)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    onboardingStep === idx
                      ? "border-[color-mix(in_srgb,var(--color-brand)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] text-[var(--color-text-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)]"
                  }`}
                >
                  {onboardingStep > idx ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current/40 flex-shrink-0" />
                  )}
                  {label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">
              {onboardingStep === 0 && (
                <p>
                  Best for demos and controlled sessions. Click <strong>Create session</strong>, copy the code, then open chat.
                </p>
              )}
              {onboardingStep === 1 && (
                <p>
                  Best when someone already created a room. Paste their invite code and join — your profile sets the UI automatically.
                </p>
              )}
              {onboardingStep === 2 && (
                <p>
                  Best for finding a random partner. Matchmaking uses your profile (Deaf pairs with Mute/Normal).
                </p>
              )}
              <button
                type="button"
                onClick={finishOnboarding}
                className="mt-2 inline-flex items-center gap-1 text-[var(--color-brand)] hover:text-[var(--color-brand-dim)]"
              >
                Got it
                <ArrowRightCircle className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ── Live Demo Guide ──────────────────────────────────── */}
        {showDemoGuide && (
          <section className="rounded-2xl border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-muted)] p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-success)]">
                  <Zap className="w-3.5 h-3.5" />
                  Live demo — same WiFi setup
                </p>
                <h2 className="mt-1 text-base font-semibold text-[var(--color-text-primary)]">
                  How to run the group demo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoGuide(false)}
                className="rounded-lg p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Dismiss demo guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <ol className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--color-success-muted)] border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] flex items-center justify-center text-[10px] font-bold text-[var(--color-success)] flex-shrink-0">1</span>
                <span><strong className="text-[var(--color-text-primary)]">Person A</strong> clicks <em>Create session</em> → copies the invite code.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--color-success-muted)] border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] flex items-center justify-center text-[10px] font-bold text-[var(--color-success)] flex-shrink-0">2</span>
                <span><strong className="text-[var(--color-text-primary)]">Persons B, C, D</strong> enter the code in <em>Join with code</em> — each joins with their own profile.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--color-success-muted)] border border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] flex items-center justify-center text-[10px] font-bold text-[var(--color-success)] flex-shrink-0">3</span>
                <span>Everyone clicks <em>Open chat room</em> — the room is now live. All messages appear on all screens.</span>
              </li>
            </ol>

            {/* Role cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                {
                  icon: Ear,
                  label: "Deaf",
                  desc: "Reads captions · uses sign keyboard · sees 2D animations",
                  color: "text-[var(--color-brand)]",
                  bg: "bg-[var(--color-brand-muted)] border-[color-mix(in_srgb,var(--color-brand)_28%,transparent)]",
                },
                {
                  icon: MessageSquare,
                  label: "Mute",
                  desc: "Types text · hears peer messages via TTS · no sign keyboard",
                  color: "text-[var(--color-accent)]",
                  bg: "bg-[var(--color-accent-muted)] border-[color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
                },
                {
                  icon: Zap,
                  label: "Deaf & Mute",
                  desc: "Sign keyboard · sees 2D animations · no mic or TTS",
                  color: "text-[var(--color-warning)]",
                  bg: "bg-[var(--color-warning-bg)] border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)]",
                },
                {
                  icon: Mic2,
                  label: "Normal",
                  desc: "Speaks via mic · transcribed live · full audio/TTS support",
                  color: "text-[var(--color-success)]",
                  bg: "bg-[var(--color-success-muted)] border-[color-mix(in_srgb,var(--color-success)_35%,transparent)]",
                },
              ].map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className={`rounded-xl border p-3 space-y-1 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Suggested next step</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{suggestedPath}</p>
        </section>

        {recentSession && (
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Recent session</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Last used via <strong>{recentSession.source}</strong> ·{" "}
                  {new Date(recentSession.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => router.push(`/chat/${recentSession.sessionId}`)}>
                  Rejoin chat
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={clearRecentSession}>
                  Clear
                </Button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            ref={createSectionRef}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3 scroll-mt-24"
          >
            <h2 className="font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-[var(--color-brand)]" />
              New room
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Create a room, share your invite code, then open chat. This is the easiest flow for demos.
            </p>
            <Button type="button" variant="primary" onClick={handleCreate} isLoading={busy} disabled={!!createdRoom}>
              Create session
            </Button>
            {createdRoom && (
              <div className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_30%,transparent)] bg-[var(--color-brand-muted)] p-4 space-y-3">
                <p className="text-sm text-[var(--color-text-secondary)]">Share this invite code:</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-[var(--color-text-primary)] break-all">
                  {createdRoom.code}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => copyCode(createdRoom.code)}>
                    Copy code
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      persistRecentSession(createdRoom.id, "create");
                      router.push(`/chat/${createdRoom.id}`);
                    }}
                  >
                    Open chat room
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section
            ref={joinSectionRef}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3 scroll-mt-24"
          >
            <h2 className="font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2">
              <ArrowRightCircle className="w-4 h-4 text-[var(--color-brand)]" />
              Join with code
            </h2>
            <input
              value={invite}
              onBlur={() => setInviteTouched(true)}
              onChange={(e) => {
                setInviteTouched(true);
                setInvite(e.target.value.toUpperCase());
              }}
              placeholder="Invite code"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] uppercase"
            />
            {inviteError && <p className="text-xs text-[var(--color-error)]">{inviteError}</p>}
            <p className="text-xs text-[var(--color-text-muted)]">
              Joining as <strong>{profileLabel}</strong> — session behavior follows your profile from signup.
            </p>
            <Button type="button" variant="secondary" onClick={handleJoin} isLoading={busy} disabled={!canJoin}>
              Join session
            </Button>
          </section>

          <section
            ref={matchSectionRef}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3 lg:col-span-2 scroll-mt-24"
          >
            <h2 className="font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-brand)]" />
              Matchmaking
              <span
                title="Pairs Deaf/Deaf & Mute with Mute/Normal profiles automatically."
                className="inline-flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <CircleHelp className="w-4 h-4" />
              </span>
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Uses your <strong>{profileLabel}</strong> profile — no role selection needed.
            </p>
            <Button type="button" variant="secondary" onClick={handleMatch} isLoading={busy} className="w-full sm:w-auto">
              <Compass className="w-4 h-4 mr-1" />
              Find a partner
            </Button>
            
          </section>
        </div>

        {status && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
              statusKind === "error"
                ? "border-[color-mix(in_srgb,var(--color-error)_40%,transparent)] bg-[var(--color-error-bg)] text-[var(--color-error)]"
                : statusKind === "success"
                ? "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[var(--color-success-muted)] text-[var(--color-success)]"
                : "border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] bg-[var(--color-brand-muted)] text-[var(--color-brand-dim)]"
            }`}
          >
            {statusKind === "error" ? (
              <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{status}</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur px-3 py-2">
        <div className="mx-auto max-w-5xl grid grid-cols-3 gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => jumpTo("create")} className="w-full">
            Create
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => jumpTo("join")} className="w-full">
            Join
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => jumpTo("match")} className="w-full">
            Match
          </Button>
        </div>
      </div>
    </div>
  );
}

