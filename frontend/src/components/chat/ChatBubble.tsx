"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, HelpCircle, Languages, Volume2 } from "lucide-react";
import { clsx } from "clsx";
import { ChatMessage } from "@/lib/state/sessionStore";
import { useSessionStore } from "@/lib/state/sessionStore";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
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

const DEFAULT_EMOTE: EmoteDescriptor = {
  emoji: "✨",
  label: "emote",
  motion: "pulse",
};

function resolveEmote(raw: string): EmoteDescriptor {
  const normalized = raw.trim().toLowerCase();

  if (/(wave|hello|hi|greet|salam|salam|مرحب|اهلا|أهلا|السلام)/i.test(normalized)) {
    return { emoji: "👋", label: "wave", motion: "wave" };
  }
  if (/(laugh|lol|haha|ضحك|يضحك)/i.test(normalized)) {
    return { emoji: "😂", label: "laugh", motion: "pop" };
  }
  if (/(smile|happy|joy|سعيد|ابتسام)/i.test(normalized)) {
    return { emoji: "😊", label: "smile", motion: "pulse" };
  }
  if (/(sad|sorry|حزين|اسف|آسف)/i.test(normalized)) {
    return { emoji: "😔", label: "sad", motion: "pulse" };
  }
  if (/(thumb|great|good job|ممتاز|رائع|تمام|اوكي|أوكي)/i.test(normalized)) {
    return { emoji: "👍", label: "thumbs up", motion: "nod" };
  }
  if (/(clap|bravo|تصفيق|أحسنت|احسنت)/i.test(normalized)) {
    return { emoji: "👏", label: "clap", motion: "pop" };
  }
  if (/(think|hmm|تفكير|أفكر|افكر)/i.test(normalized)) {
    return { emoji: "🤔", label: "think", motion: "nod" };
  }
  if (/(heart|love|حب|قلبي)/i.test(normalized)) {
    return { emoji: "❤️", label: "love", motion: "pulse" };
  }
  if (/(shrug|idk|ما ادري|ما أدري|مش عارف)/i.test(normalized)) {
    return { emoji: "🤷", label: "shrug", motion: "nod" };
  }

  return DEFAULT_EMOTE;
}

function parseSegments(text: string): Segment[] {
  const chunks = text.split(/(\*[^*\n]+\*)/g);
  return chunks
    .filter((chunk) => chunk.length > 0)
    .map((chunk): Segment => {
      const isEmote =
        chunk.startsWith("*") &&
        chunk.endsWith("*") &&
        chunk.length > 2 &&
        !chunk.startsWith("**") &&
        !chunk.endsWith("**");
      if (!isEmote) return { type: "text", value: chunk };
      const emoteText = chunk.slice(1, -1).trim();
      return {
        type: "emote",
        value: emoteText,
        descriptor: resolveEmote(emoteText),
      };
    });
}

export function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const { language } = useSessionStore();
  const t = useTranslations(language);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const segments = useMemo(() => parseSegments(message.text), [message.text]);

  const isUser = message.role === "user";
  const isTranscript = message.role === "transcript";
  const isAssistant = message.role === "assistant";
  const isActionResult = message.role === "action-result";

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
      const audio = new Audio(url);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch {
      showToast("error", t.errors.ttsFailed);
      setIsSpeaking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "group flex gap-3 max-w-[88%]",
        isUser ? "self-end flex-row-reverse" : "self-start"
      )}
    >
      {/* Avatar dot */}
      <div
        className={clsx(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1",
          isUser && "bg-brand-600 text-white",
          isTranscript && "bg-blue-600 text-white",
          (isAssistant || isActionResult) && "bg-violet-700 text-white"
        )}
        aria-hidden
      >
        {isUser ? "Y" : isTranscript ? "T" : "AI"}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Label row */}
        <div
          className={clsx(
            "flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]",
            isUser && "flex-row-reverse"
          )}
        >
          <span className="font-medium">
            {isUser
              ? t.chat.you
              : isTranscript
              ? t.chat.transcript
              : t.chat.assistant}
          </span>

          {isTranscript && message.confidence !== undefined && (
            <Badge variant={message.confidence > 0.85 ? "success" : "warning"}>
              {Math.round(message.confidence * 100)}%
            </Badge>
          )}

          {message.detectedLang && (
            <Badge variant="info">{message.detectedLang.toUpperCase()}</Badge>
          )}

          {message.action && (
            <Badge variant="processing">
              {message.action === "simplify"
                ? "Simplified"
                : message.action === "clarify"
                ? "Clarified"
                : "Translated"}
            </Badge>
          )}

          {message.fromPeer && <Badge variant="info">Peer</Badge>}

          <span className="opacity-80">{formatTime(message.timestamp)}</span>
        </div>

        {/* Bubble */}
        <div
          className={clsx(
            "relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-[0_12px_30px_-28px_rgba(0,0,0,0.9)]",
            "transition-all duration-150",
            isUser &&
              "bg-brand-600 text-white rounded-tr-sm border border-brand-400/30",
            isTranscript &&
              "bg-blue-600/12 border border-blue-500/25 text-[var(--color-text-primary)] rounded-tl-sm",
            (isAssistant || isActionResult) &&
              "bg-surface-raised border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-tl-sm",
            message.isPartial && "opacity-80"
          )}
        >
          <p className="emoji-text whitespace-pre-wrap break-words">
            {segments.map((segment, index) => {
              if (segment.type === "text") {
                return <Fragment key={`txt-${message.id}-${index}`}>{segment.value}</Fragment>;
              }
              return (
                <span
                  key={`emo-${message.id}-${index}`}
                  className="emote-chip"
                  title={`*${segment.value}*`}
                  aria-label={`${segment.descriptor.label} emote`}
                >
                  <span
                    role="img"
                    aria-hidden
                    className={clsx(
                      "emote-emoji",
                      segment.descriptor.motion === "wave" && "animate-emote-wave",
                      segment.descriptor.motion === "pulse" && "animate-emote-pulse",
                      segment.descriptor.motion === "pop" && "animate-emote-pop",
                      segment.descriptor.motion === "nod" && "animate-emote-nod"
                    )}
                  >
                    {segment.descriptor.emoji}
                  </span>
                  <span className="emote-label">{segment.value}</span>
                </span>
              );
            })}
          </p>

          {message.isPartial && (
            <span className="inline-flex ml-1 gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-current opacity-60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}

          {!message.isPartial && !isUser && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction("simplify", message.text, message.id)}
                title={t.actions.simplifyHint}
                aria-label={t.actions.simplify}
                className="h-7 px-2 gap-1 workspace-chip"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs">{t.actions.simplify}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction("clarify", message.text, message.id)}
                title={t.actions.clarifyHint}
                aria-label={t.actions.clarify}
                className="h-7 px-2 gap-1 workspace-chip"
              >
                <HelpCircle className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs">{t.actions.clarify}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction("translate", message.text, message.id)}
                title={t.actions.translateHint}
                aria-label={t.actions.translate}
                className="h-7 px-2 gap-1 workspace-chip"
              >
                <Languages className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs">{t.actions.translate}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Action toolbar */}
        {!message.isPartial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx(
              "flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
              isUser && "flex-row-reverse"
            )}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              title={t.actions.copy}
              aria-label={t.actions.copy}
              className="h-7 px-2"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleSpeak}
              title={t.actions.speakThis}
              aria-label={t.actions.speakThis}
              className="h-7 px-2"
              disabled={isSpeaking}
            >
              <Volume2 className={clsx("w-3.5 h-3.5", isSpeaking && "text-emerald-400 animate-pulse")} />
            </Button>

          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
