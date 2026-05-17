"use client";

/**
 * PeerJoinOverlay
 *
 * A standalone peer-joined notification modal.  It reads from the global
 * Zustand store and can be rendered on any authenticated page (lobby,
 * dashboard, session workspace) so the user always sees the notification
 * no matter which route they're on.
 */

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { SignPreview } from "@/components/avatar/SignPreview";
import { useTranslations } from "@/lib/i18n";

type ProfileUserType = "deaf" | "mute" | "both" | "normal";

interface PeerJoinOverlayProps {
  userType?: ProfileUserType | null;
}

function sessionIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/app\/sessions\/([^/]+)/);
  return match?.[1] ?? null;
}

export function PeerJoinOverlay({ userType }: PeerJoinOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const language = useSessionStore((s) => s.language);
  const t = useTranslations(language);
  const { peerJoinAlert, setPeerJoinAlert } = useSessionStore();

  const routeSessionId = sessionIdFromPath(pathname);
  const alreadyInSession =
    !!peerJoinAlert?.sessionId && routeSessionId === peerJoinAlert.sessionId;

  const primaryLabel = alreadyInSession ? t.peerJoin.openChat : t.peerJoin.joinChat;
  const bodySuffix = alreadyInSession ? t.peerJoin.bodyInSession : t.peerJoin.bodyJoin;

  return (
    <AnimatePresence>
      {peerJoinAlert && (
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(8px)" }}
          role="alertdialog"
          aria-modal="true"
          aria-label="Partner wants to chat"
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(34,197,94,0.15)",
                border: "1.5px solid rgba(34,197,94,0.45)",
              }}
            >
              <UserCheck className="w-8 h-8" style={{ color: "#22c55e" }} />
            </motion.div>

            <motion.div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                {userType === "deaf" || userType === "both"
                  ? t.peerJoin.titleDeaf
                  : t.peerJoin.titleHearing}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {peerJoinAlert.name}
                </span>{" "}
                {bodySuffix}
              </p>
            </motion.div>

            {(userType === "deaf" || userType === "both") && (
              <div
                className="w-full rounded-xl overflow-hidden"
                style={{
                  background: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  minHeight: 120,
                }}
              >
                <SignPreview overridePhraseKey="hello" compact />
              </div>
            )}

            <motion.div className="flex flex-col gap-2 w-full mt-1">
              <button
                type="button"
                onClick={() => {
                  const sid = peerJoinAlert.sessionId;
                  setPeerJoinAlert(null);
                  if (sid) router.push(`/app/sessions/${sid}`);
                }}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-accent-500) 100%)",
                  color: "#fff",
                  boxShadow: "0 0 16px var(--color-brand-glow)",
                }}
              >
                {primaryLabel}
              </button>
              <button
                type="button"
                onClick={() => setPeerJoinAlert(null)}
                className="w-full rounded-xl py-2 text-sm transition-all active:scale-95"
                style={{
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {t.peerJoin.dismiss}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
