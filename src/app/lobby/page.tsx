"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api/client";
import { fetchMe, logoutAccount } from "@/lib/api/authApi";
import { createSession, joinSessionByCode, matchEnqueue, matchPoll } from "@/lib/api/sessionApi";
import { Button } from "@/components/common/Button";

export default function LobbyPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [invite, setInvite] = useState("");
  const [joinRole, setJoinRole] = useState<"deaf" | "mute">("deaf");
  /** Which queue to use for Find a partner — must be opposite between two users for a match. */
  const [queueSide, setQueueSide] = useState<"deaf" | "mute">("deaf");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; code: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    fetchMe(t)
      .then((u) => {
        setDisplayName(u.display_name);
        setUserType(u.user_type);
        if (u.user_type === "mute") setQueueSide("mute");
        else setQueueSide("deaf");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const startMatchPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const t = getStoredToken();
      if (!t) return;
      try {
        const p = await matchPoll(t);
        if (p.matched && p.session_id) {
          stopPolling();
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
    setCreatedRoom(null);
    try {
      const s = await createSession(token, { mode: "direct" });
      if (s.invite_code) {
        setCreatedRoom({ id: s.id, code: s.invite_code });
        setStatus(null);
      } else {
        router.push(`/chat/${s.id}`);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not create session");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!token || !invite.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const s = await joinSessionByCode(token, invite.trim(), joinRole);
      router.push(`/chat/${s.id}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  async function handleMatch() {
    if (!token) return;
    setBusy(true);
    setStatus(null);
    stopPolling();
    try {
      const r = await matchEnqueue(token, queueSide);
      if (r.status === "matched" && r.session_id) {
        router.push(`/chat/${r.session_id}`);
        return;
      }
      setStatus(
        "Waiting for a partner on the other side (listener ↔ speaker). This page will open the room automatically when they join."
      );
      startMatchPolling();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Match failed");
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
    } catch {
      setStatus("Could not copy — select and copy manually.");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Lobby</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Signed in as {displayName || "…"}
              {userType ? ` · Profile: ${userType}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="text-sm text-brand-400 hover:underline self-center">
              Demo chat
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
          <h2 className="font-medium text-[var(--color-text-primary)]">New room</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Create a room, copy the invite code for your partner, then open the chat. The code is also shown at the top
            of the room page.
          </p>
          <Button type="button" variant="primary" onClick={handleCreate} isLoading={busy} disabled={!!createdRoom}>
            Create session
          </Button>
          {createdRoom && (
            <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-600/10 p-4 space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">Share this invite code:</p>
              <p className="text-2xl font-mono font-bold tracking-wider text-[var(--color-text-primary)] break-all">
                {createdRoom.code}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => copyCode(createdRoom.code)}>
                  Copy code
                </Button>
                <Button type="button" size="sm" variant="primary" onClick={() => router.push(`/chat/${createdRoom.id}`)}>
                  Open chat room
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
          <h2 className="font-medium text-[var(--color-text-primary)]">Join with code</h2>
          <input
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            placeholder="Invite code"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] uppercase"
          />
          <select
            value={joinRole}
            onChange={(e) => setJoinRole(e.target.value as "deaf" | "mute")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="deaf">Join as deaf / listener</option>
            <option value="mute">Join as mute / speaker</option>
          </select>
          <Button type="button" variant="secondary" onClick={handleJoin} isLoading={busy} disabled={!invite.trim()}>
            Join session
          </Button>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
          <h2 className="font-medium text-[var(--color-text-primary)]">Matchmaking</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            One person must choose <strong>Listener side</strong> and the other <strong>Speaker side</strong>. If you
            both use the same side, you will never match — even if your profiles are different.
          </p>
          <label className="block text-sm text-[var(--color-text-secondary)]" htmlFor="queue-side">
            I am joining as
          </label>
          <select
            id="queue-side"
            value={queueSide}
            onChange={(e) => setQueueSide(e.target.value as "deaf" | "mute")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)]"
          >
            <option value="deaf">Listener side (deaf / captions / STT)</option>
            <option value="mute">Speaker side (mute / text / TTS)</option>
          </select>
          <Button type="button" variant="secondary" onClick={handleMatch} isLoading={busy}>
            Find a partner
          </Button>
        </section>

        {status && <p className="text-sm text-[var(--color-text-secondary)]">{status}</p>}
      </div>
    </div>
  );
}
