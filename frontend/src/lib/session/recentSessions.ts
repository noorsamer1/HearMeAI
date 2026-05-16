/** Client-side recent session list (localStorage) shared by lobby and sessions UI. */

export const RECENT_SESSION_KEY = "hearmeai-recent-session";
export const RECENT_SESSIONS_KEY = "hearmeai-recent-sessions";

export type RecentSessionItem = {
  sessionId: string;
  source: "create" | "join" | "match";
  at: number;
};

export function readRecentSessions(): RecentSessionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const rawList = window.localStorage.getItem(RECENT_SESSIONS_KEY);
    if (rawList) {
      const parsed = JSON.parse(rawList) as RecentSessionItem[];
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => !!x?.sessionId);
      }
    }
  } catch {
    // fall through to legacy key
  }

  try {
    const rawSingle = window.localStorage.getItem(RECENT_SESSION_KEY);
    if (!rawSingle) return [];
    const one = JSON.parse(rawSingle) as RecentSessionItem;
    return one?.sessionId ? [one] : [];
  } catch {
    return [];
  }
}

export function hasRecentSessions(): boolean {
  return readRecentSessions().length > 0;
}

/** Where to send the user immediately after login or signup. */
export function getPostAuthRedirectPath(): "/app/sessions" | "/lobby" {
  return hasRecentSessions() ? "/app/sessions" : "/lobby";
}
