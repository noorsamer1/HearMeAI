"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api/client";
import { getSession, getWsTicket } from "@/lib/api/sessionApi";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { useSessionStore } from "@/lib/state/sessionStore";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [wsTicket, setWsTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const setSessionId = useSessionStore((s) => s.setSessionId);

  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession(token, sessionId);
        if (!cancelled) setInviteCode(session.invite_code ?? null);
        const w = await getWsTicket(token, sessionId);
        if (!cancelled) setWsTicket(w.token);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not open room");
          router.replace("/lobby");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (loading || !wsTicket) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] text-[var(--color-text-muted)]">
        <p>Connecting to room…</p>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <Link href="/lobby" className="text-brand-400 text-sm hover:underline">
          Back to lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-[var(--color-text-muted)] truncate text-xs">Room ID · {sessionId.slice(0, 8)}…</span>
          {inviteCode ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--color-text-primary)] font-mono font-semibold tracking-wide">{inviteCode}</span>
              <button
                type="button"
                className="text-brand-400 hover:underline text-xs"
                onClick={() => navigator.clipboard.writeText(inviteCode)}
              >
                Copy invite
              </button>
            </div>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">No invite code (joined or matched room)</span>
          )}
        </div>
        <Link href="/lobby" className="text-brand-400 hover:underline shrink-0">
          Lobby
        </Link>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatWorkspace wsToken={wsTicket} />
      </div>
    </div>
  );
}
