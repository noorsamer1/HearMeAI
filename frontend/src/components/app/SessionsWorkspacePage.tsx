"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, MessageSquareDashed, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { getStoredToken } from "@/lib/api/client";
import { fetchMe } from "@/lib/api/authApi";
import { getSession, getWsTicket, listAllSessionMessages, type SessionMessageRow } from "@/lib/api/sessionApi";
import { useSessionStore, type ChatMessage, type MessageRole } from "@/lib/state/sessionStore";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { Button } from "@/components/common/Button";

const RECENT_SESSION_KEY = "hearmeai-recent-session";
const RECENT_SESSIONS_KEY = "hearmeai-recent-sessions";

type RecentSource = "create" | "join" | "match";
type UserType = "deaf" | "mute" | "both";

type SessionListItem = {
  sessionId: string;
  source: RecentSource;
  at: number;
};

interface SessionsWorkspacePageProps {
  initialSessionId?: string | null;
}

export default function SessionsWorkspacePage({ initialSessionId = null }: SessionsWorkspacePageProps) {
  const router = useRouter();
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const clearMessages = useSessionStore((s) => s.clearMessages);
  const setMessages = useSessionStore((s) => s.setMessages);

  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>("deaf");
  const userTypeRef = useRef<UserType>("deaf");
  userTypeRef.current = userType;
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId);
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    fetchMe(t)
      .then((u) => {
        const resolved = (u.user_type as UserType) || "deaf";
        setUserType(resolved);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!initialSessionId) return;
    setActiveSessionId(initialSessionId);
  }, [initialSessionId]);

  useEffect(() => {
    const loaded = readRecentSessions();
    setSessions(loaded);
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setWsTicket(null);
      setSessionError(null);
      return;
    }
    if (!token) return;

    setSessionLoading(true);
    setSessionError(null);
    setWsTicket(null);

    setSessionId(activeSessionId);
    clearMessages();

    let cancelled = false;
    (async () => {
      try {
        await getSession(token, activeSessionId);
        const apiMessages = await listAllSessionMessages(token, activeSessionId);
        if (cancelled) return;
        setMessages(apiMessages.map(sessionRowToChatMessage));
        const ws = await getWsTicket(token, activeSessionId);
        if (cancelled) return;
        setWsTicket(ws.token);
        upsertRecentSession({
          sessionId: activeSessionId,
          source: inferSourceFromUserType(userTypeRef.current),
          at: Date.now(),
        });
        setSessions(readRecentSessions());
      } catch (err) {
        if (cancelled) return;
        setSessionError(err instanceof Error ? err.message : "Could not open session");
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, token, setSessionId, clearMessages, setMessages]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.at - a.at),
    [sessions]
  );
  const hasSessions = sortedSessions.length > 0;

  function openSession(sessionId: string) {
    setActiveSessionId(sessionId);
    router.push(`/app/sessions/${sessionId}`);
  }

  function removeSession(sessionId: string) {
    const next = sessions.filter((item) => item.sessionId !== sessionId);
    setSessions(next);
    writeRecentSessions(next);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setSessionError(null);
      setWsTicket(null);
      router.push("/app/sessions");
    }
  }

  return (
    <div className="h-full min-h-0 flex bg-[var(--color-bg)]">
      <aside className="hidden lg:flex w-[21.5rem] shrink-0 flex-col border-r border-[var(--color-border)]/60 bg-[var(--color-surface)]/46 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-[var(--color-border)]/60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Sessions</p>
            <span className="text-[11px] rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[var(--color-text-muted)]">
              {sortedSessions.length}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Privacy mode: role + time only
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {!hasSessions ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text-muted)]">
              No recent sessions yet.
              <div className="mt-3">
                <Link href="/lobby" className="text-brand-300 hover:text-brand-200 hover:underline">
                  Create or join from lobby
                </Link>
              </div>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isActive = session.sessionId === activeSessionId;
              return (
                <div
                  key={session.sessionId}
                  className={`workspace-zone w-full px-3 py-3 text-left transition ${
                    isActive
                      ? "border-brand-400/50 bg-brand-500/15 shadow-[0_14px_30px_-24px_rgba(99,102,241,0.8)]"
                      : "hover:border-brand-400/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openSession(session.sessionId)}
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Session ${session.sessionId.slice(0, 8)}, ${sourceLabel(session.source)}, updated ${new Date(session.at).toLocaleTimeString()}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="text-sm font-medium text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
                        <UsersRound className="w-4 h-4 text-brand-300" />
                        {sourceLabel(session.source)}
                      </span>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        Session #{session.sessionId.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        {new Date(session.at).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      {isActive && <span className="text-xs text-brand-300">Active</span>}
                      <button
                        type="button"
                        onClick={() => removeSession(session.sessionId)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-rose-300"
                        aria-label={`Remove session ${session.sessionId.slice(0, 8)} from recent list`}
                        title="Remove from recent list"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex-1 min-w-0 bg-[var(--color-bg)]">
        <div className="h-full min-h-0 flex flex-col">
          <div className="lg:hidden px-3 py-2 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {!hasSessions ? (
                <div className="inline-flex items-center gap-2">
                  <p className="text-xs text-[var(--color-text-muted)]">No recent sessions yet.</p>
                  <Link href="/lobby" className="text-xs text-brand-300 hover:text-brand-200 hover:underline">
                    Open lobby
                  </Link>
                </div>
              ) : (
                sortedSessions.map((session) => {
                  const isActive = session.sessionId === activeSessionId;
                  return (
                    <button
                      key={`mobile-${session.sessionId}`}
                      type="button"
                      onClick={() => openSession(session.sessionId)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                        isActive
                          ? "border-brand-400/60 bg-brand-500/20 text-brand-200"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {sourceLabel(session.source)} · {new Date(session.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="workspace-subtle-header px-4 py-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] inline-flex items-center gap-2">
              <MessageSquareDashed className="w-3.5 h-3.5" />
              Session workspace
            </h2>
            <div className="text-xs rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text-secondary)] inline-flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5" />
              {modeLabel(userType)}
            </div>
          </div>

          {!activeSessionId ? (
            <EmptyState />
          ) : sessionError ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="max-w-md text-center space-y-3">
                <p className="text-rose-300 text-sm">{sessionError}</p>
                <div className="flex items-center justify-center gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setActiveSessionId(null)}>
                    Back to session list
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => activeSessionId && removeSession(activeSessionId)}
                  >
                    Remove stale session
                  </Button>
                </div>
              </div>
            </div>
          ) : sessionLoading || !wsTicket ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="w-full max-w-md space-y-3">
                <p className="text-sm text-[var(--color-text-muted)] text-center">Connecting to session...</p>
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-[var(--color-border)]/40 animate-pulse" />
                  <div className="h-3 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
                  <div className="h-3 w-2/3 mx-auto rounded-full bg-[var(--color-border)]/20 animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            <ChatWorkspace wsToken={wsTicket} userType={userType} />
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No session selected</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Create a new room or join by invite from the lobby, then open it from Sessions.
        </p>
        <div className="mt-4">
          <Link href="/lobby" className="text-sm text-brand-300 hover:text-brand-200 hover:underline">
            Go to lobby
          </Link>
        </div>
      </div>
    </div>
  );
}

function sourceLabel(source: RecentSource): string {
  if (source === "create") return "Room owner";
  if (source === "join") return "Joined by code";
  return "Matched session";
}

function modeLabel(userType: UserType): string {
  if (userType === "both") return "Dual mode (Listener + Speaker)";
  if (userType === "mute") return "Speaker mode";
  return "Listener mode";
}

function inferSourceFromUserType(userType: UserType): RecentSource {
  if (userType === "mute") return "join";
  if (userType === "both") return "match";
  return "create";
}

function sessionRowToChatMessage(row: SessionMessageRow): ChatMessage {
  const role: MessageRole =
    row.kind === "transcript"
      ? "transcript"
      : row.kind === "user_text"
        ? "user"
        : "assistant";
  const t = Date.parse(row.created_at);
  return {
    id: row.id,
    role,
    text: row.content_text,
    timestamp: Number.isFinite(t) ? t : Date.now(),
    isPartial: false,
  };
}

function readRecentSessions(): SessionListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const rawList = window.localStorage.getItem(RECENT_SESSIONS_KEY);
    if (rawList) {
      const parsed = JSON.parse(rawList) as SessionListItem[];
      if (Array.isArray(parsed)) return parsed.filter((x) => !!x?.sessionId);
    }
  } catch {
    // fall through to legacy key
  }

  try {
    const rawSingle = window.localStorage.getItem(RECENT_SESSION_KEY);
    if (!rawSingle) return [];
    const one = JSON.parse(rawSingle) as SessionListItem;
    return one?.sessionId ? [one] : [];
  } catch {
    return [];
  }
}

function upsertRecentSession(item: SessionListItem) {
  if (typeof window === "undefined") return;
  const current = readRecentSessions();
  const next = [item, ...current.filter((x) => x.sessionId !== item.sessionId)].slice(0, 12);
  writeRecentSessions(next, item);
}

function writeRecentSessions(list: SessionListItem[], latest?: SessionListItem) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(list));
  if (latest) {
    window.localStorage.setItem(RECENT_SESSION_KEY, JSON.stringify(latest));
    return;
  }
  const first = list[0];
  if (first) {
    window.localStorage.setItem(RECENT_SESSION_KEY, JSON.stringify(first));
  } else {
    window.localStorage.removeItem(RECENT_SESSION_KEY);
  }
}
