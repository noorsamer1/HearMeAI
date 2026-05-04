import { apiFetch } from "./client";

export interface SessionParticipant {
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface SessionDetail {
  id: string;
  mode: string;
  invite_code: string | null;
  created_by: string;
  ai_assist_enabled: boolean;
  created_at: string;
  closed_at: string | null;
  participants: SessionParticipant[];
}

export interface SessionMessageRow {
  id: string;
  session_id: string;
  sender_id: string | null;
  kind: string;
  content_text: string;
  created_at: string;
  sentiment_label?: string | null;
  intent?: string | null;
  enhancement_text?: string | null;
}

export interface SessionMessagesPage {
  items: SessionMessageRow[];
  offset: number;
  limit: number;
  has_more: boolean;
}

export async function createSession(
  token: string,
  body: { mode?: "direct" | "matched"; invite_code?: string | null } = {}
): Promise<SessionDetail> {
  return apiFetch("/api/v1/sessions", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function joinSessionByCode(
  token: string,
  invite_code: string,
  role: "deaf" | "mute"
): Promise<SessionDetail> {
  return apiFetch("/api/v1/sessions/join", {
    method: "POST",
    token,
    body: JSON.stringify({ invite_code, role }),
  });
}

export async function getSession(token: string, sessionId: string): Promise<SessionDetail> {
  return apiFetch(`/api/v1/sessions/${sessionId}`, { token });
}

export async function listSessionMessages(
  token: string,
  sessionId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<SessionMessagesPage> {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiFetch(`/api/v1/sessions/${sessionId}/messages?${qs}`, { token });
}

/** Loads all pages (oldest → newest order from API) for hydrating the chat UI. */
export async function listAllSessionMessages(token: string, sessionId: string): Promise<SessionMessageRow[]> {
  const all: SessionMessageRow[] = [];
  let offset = 0;
  const limit = 100;
  const maxRows = 5000;
  while (all.length < maxRows) {
    const page = await listSessionMessages(token, sessionId, { limit, offset });
    all.push(...page.items);
    if (!page.has_more) break;
    offset += limit;
  }
  return all;
}

export async function getWsTicket(token: string, sessionId: string): Promise<{ token: string; expires_in: number }> {
  return apiFetch(`/api/v1/sessions/${sessionId}/ws-ticket`, {
    method: "POST",
    token,
  });
}

export async function matchEnqueue(
  token: string,
  role: "deaf" | "mute"
): Promise<{
  status: string;
  session_id: string | null;
  position_hint: number | null;
}> {
  return apiFetch("/api/v1/match/enqueue", {
    method: "POST",
    token,
    body: JSON.stringify({ role }),
  });
}

export async function matchPoll(token: string): Promise<{ matched: boolean; session_id: string | null }> {
  return apiFetch("/api/v1/match/poll", { token });
}

export async function matchDequeue(token: string): Promise<void> {
  await apiFetch("/api/v1/match/dequeue", { method: "DELETE", token });
}
