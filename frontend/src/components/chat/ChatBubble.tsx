"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, HelpCircle, Languages, Volume2 } from "lucide-react";
import { clsx } from "clsx";
import { ChatMessage } from "@/lib/state/sessionStore";
import { useSessionStore } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";
import { showToast } from "@/components/common/Toast";
import { base64ToAudioUrl, synthesizeSpeech } from "@/lib/api/client";

interface ChatBubbleProps {
  message: ChatMessage;
  onAction: (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => void;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

type EmoteMotion = "wave" | "pulse" | "pop" | "nod";

type EmoteDescriptor = {
  emoji: string;
  label: string;
  motion: EmoteMotion;
};

type Segment =
  | { type: "text"; value: string }
  | { type: "emote"; value: string; descriptor: EmoteDescriptor };

const DEFAULT_EMOTE: EmoteDescriptor = { emoji: "✨", label: "emote", motion: "pulse" };

function resolveEmote(raw: string): EmoteDescriptor {
  const n = raw.trim().toLowerCase();
  if (/(wave|hello|hi|greet|salam|مرحب|اهلا|أهلا|السلام)/i.test(n))   return { emoji: "👋", label: "wave", motion: "wave" };
  if (/(laugh|lol|haha|ضحك|يضحك)/i.test(n))                            return { emoji: "😂", label: "laugh", motion: "pop" };
  if (/(smile|happy|joy|سعيد|ابتسام)/i.test(n))                        return { emoji: "😊", label: "smile", motion: "pulse" };
  if (/(sad|sorry|حزين|اسف|آسف)/i.test(n))                             return { emoji: "😔", label: "sad", motion: "pulse" };
  if (/(thumb|great|good job|ممتاز|رائع|تمام|اوكي|أوكي)/i.test(n))    return { emoji: "👍", label: "thumbs up", motion: "nod" };
  if (/(clap|bravo|تصفيق|أحسنت|احسنت)/i.test(n))                      return { emoji: "👏", label: "clap", motion: "pop" };
  if (/(think|hmm|تفكير|أفكر|افكر)/i.test(n))                         return { emoji: "🤔", label: "think", motion: "nod" };
  if (/(heart|love|حب|قلبي)/i.test(n))                                 return { emoji: "❤️", label: "love", motion: "pulse" };
  if (/(shrug|idk|ما ادري|ما أدري|مش عارف)/i.test(n))                 return { emoji: "🤷", label: "shrug", motion: "nod" };
  return DEFAULT_EMOTE;
}

function parseSegments(text: string): Segment[] {
  return text
    .split(/(\*[^*\n]+\*)/g)
    .filter((c) => c.length > 0)
    .map((chunk): Segment => {
      const isEmote =
        chunk.startsWith("*") && chunk.endsWith("*") &&
        chunk.length > 2 && !chunk.startsWith("**");
      if (!isEmote) return { type: "text", value: chunk };
      const raw = chunk.slice(1, -1).trim();
      return { type: "emote", value: raw, descriptor: resolveEmote(raw) };
    });
}

export function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const { language } = useSessionStore();
  const t = useTranslations(language);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const segments = useMemo(() => parseSegments(message.text), [message.text]);

  const isUser       = message.role === "user";
  const isTranscript = message.role === "transcript";
  const isAssistant  = message.role === "assistant";
  const isActionResult = message.role === "action-result";
  const isAiType     = isAssistant || isActionResult;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const result = await synthesizeSpeech(message.text, language);
      const url = base64ToAudioUrl(result.audio_base64);
      if (!url) {
        showToast("error", t.errors.ttsFailed);
        setIsSpeaking(false);
        return;
      }
      const audio = new Audio(url);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); };
      audio.play().catch((err) => {
        console.error("[TTS] play failed", err);
        showToast("error", t.errors.ttsFailed);
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      });
    } catch {
      showToast("error", t.errors.ttsFailed);
      setIsSpeaking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "group flex gap-2.5 max-w-[85%] sm:max-w-[78%]",
        isUser ? "self-end flex-row-reverse" : "self-start"
      )}
    >
      {/* ── Avatar ── */}
      <div
        className={clsx(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold mt-0.5 shadow-sm",
          isUser        && "avatar-user shadow-glow-sm-cyan",
          isTranscript  && "avatar-transcript",
          isAiType      && "avatar-ai shadow-glow-sm-violet"
        )}
        aria-hidden
      >
        {isUser ? "You" : isTranscript ? "STT" : "AI"}
      </div>

      {/* ── Content column ── */}
      <div className={clsx("flex flex-col gap-1 min-w-0", isUser && "items-end")}>

        {/* Label row */}
        <div
          className={clsx(
            "flex items-center gap-1.5 flex-wrap",
            isUser && "flex-row-reverse"
          )}
        >
          <span
            className="text-[11px] font-semibold"
            style={{ color: isUser ? "var(--color-brand)" : isAiType ? "var(--color-accent)" : "var(--color-text-secondary)" }}
          >
            {isUser ? t.chat.you : isTranscript ? t.chat.transcript : t.chat.assistant}
          </span>

          {isTranscript && message.confidence !== undefined && (
            <span className={clsx("pill text-[10px]", message.confidence > 0.85 ? "pill-green" : "pill-amber")}>
              {Math.round(message.confidence * 100)}%
            </span>
          )}

          {message.detectedLang && (
            <span className="pill pill-cyan text-[10px]">{message.detectedLang.toUpperCase()}</span>
          )}

          {message.action && (
            <span className="pill pill-violet text-[10px]">
              {message.action === "simplify" ? "Simplified" : message.action === "clarify" ? "Clarified" : "Translated"}
            </span>
          )}

          {message.fromPeer && <span className="pill pill-amber text-[10px]">Peer</span>}

          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* ── Bubble ── */}
        <div
          className={clsx(
            "relative px-4 py-3 text-sm leading-relaxed transition-all duration-150",
            isUser       && "bubble-user",
            isTranscript && "bubble-transcript",
            isAiType     && "bubble-ai",
            message.isPartial && "opacity-75"
          )}
        >
          {/* Text content */}
          <p className="emoji-text whitespace-pre-wrap break-words">
            {segments.map((seg, i) => {
              if (seg.type === "text") {
                return <Fragment key={`t-${message.id}-${i}`}>{seg.value}</Fragment>;
              }
              return (
                <span
                  key={`e-${message.id}-${i}`}
                  className="emote-chip"
                  title={`*${seg.value}*`}
                  aria-label={`${seg.descriptor.label} emote`}
                >
                  <span
                    role="img"
                    aria-hidden
                    className={clsx(
                      "emote-emoji",
                      seg.descriptor.motion === "wave"  && "animate-emote-wave",
                      seg.descriptor.motion === "pulse" && "animate-emote-pulse",
                      seg.descriptor.motion === "pop"   && "animate-emote-pop",
                      seg.descriptor.motion === "nod"   && "animate-emote-nod"
                    )}
                  >
                    {seg.descriptor.emoji}
                  </span>
                  <span className="emote-label">{seg.value}</span>
                </span>
              );
            })}
          </p>

          {/* Streaming dots */}
          {message.isPartial && (
            <span className="inline-flex items-end gap-0.5 ml-1.5 mb-0.5" aria-label="Typing">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full animate-typing-dot"
                  style={{
                    background: isUser ? "rgba(255,255,255,0.7)" : "var(--color-brand)",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </span>
          )}

          {/* AI action chips — inside bubble, below text */}
          {!message.isPartial && isAiType && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={() => onAction("simplify", message.text, message.id)}
                title={t.actions.simplifyHint}
                aria-label={t.actions.simplify}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#C4B5FD",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.1)";
                }}
              >
                <Sparkles className="w-3 h-3" />
                {t.actions.simplify}
              </button>

              <button
                onClick={() => onAction("clarify", message.text, message.id)}
                title={t.actions.clarifyHint}
                aria-label={t.actions.clarify}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#C4B5FD",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.1)";
                }}
              >
                <HelpCircle className="w-3 h-3" />
                {t.actions.clarify}
              </button>

              <button
                onClick={() => onAction("translate", message.text, message.id)}
                title={t.actions.translateHint}
                aria-label={t.actions.translate}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: "rgba(167,139,250,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#C4B5FD",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.1)";
                }}
              >
                <Languages className="w-3 h-3" />
                {t.actions.translate}
              </button>
            </div>
          )}
        </div>

        {/* ── Utility toolbar (copy + speak) — fades in on hover ── */}
        {!message.isPartial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx(
              "flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150",
              isUser && "flex-row-reverse"
            )}
          >
            <button
              onClick={handleCopy}
              title={t.actions.copy}
              aria-label={t.actions.copy}
              className="flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-150"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-raised)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleSpeak}
              title={t.actions.speakThis}
              aria-label={t.actions.speakThis}
              disabled={isSpeaking}
              className="flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: isSpeaking ? "var(--color-success)" : "var(--color-text-muted)" }}
              onMouseEnter={(e) => {
                if (isSpeaking) return;
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-raised)";
              }}
              onMouseLeave={(e) => {
                if (isSpeaking) return;
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <Volume2
                className={clsx("w-3.5 h-3.5", isSpeaking && "animate-pulse")}
              />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
