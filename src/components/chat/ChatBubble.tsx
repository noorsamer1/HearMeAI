"use client";

import { useState } from "react";
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

export function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const { language } = useSessionStore();
  const t = useTranslations(language);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
        "group flex gap-3 max-w-[85%]",
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
            "flex items-center gap-2 text-xs text-[var(--color-text-muted)]",
            isUser && "flex-row-reverse"
          )}
        >
          <span>
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

          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Bubble */}
        <div
          className={clsx(
            "relative px-4 py-3 rounded-2xl text-sm leading-relaxed",
            "transition-all duration-150",
            isUser &&
              "bg-brand-600 text-white rounded-tr-sm",
            isTranscript &&
              "bg-blue-600/15 border border-blue-500/25 text-[var(--color-text-primary)] rounded-tl-sm",
            (isAssistant || isActionResult) &&
              "bg-surface-raised border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-tl-sm",
            message.isPartial && "opacity-80"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>

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
        </div>

        {/* Action toolbar */}
        {!message.isPartial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={clsx(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
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

            {!isUser && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction("simplify", message.text, message.id)}
                  title={t.actions.simplifyHint}
                  aria-label={t.actions.simplify}
                  className="h-7 px-2 gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">{t.actions.simplify}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction("clarify", message.text, message.id)}
                  title={t.actions.clarifyHint}
                  aria-label={t.actions.clarify}
                  className="h-7 px-2 gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">{t.actions.clarify}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction("translate", message.text, message.id)}
                  title={t.actions.translateHint}
                  aria-label={t.actions.translate}
                  className="h-7 px-2 gap-1"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span className="text-xs hidden sm:inline">{t.actions.translate}</span>
                </Button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
