"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, Volume2, User, Mic } from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  isStreaming?: boolean;
}

export default function ChatArea() {
  const messages: Message[] = [
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am ready to translate and synthesize speech for you. Shall we begin?"
    },
    {
      id: "2",
      sender: "user",
      text: "Yes, thank you. Let's test the new high-contrast UI."
    },
    {
      id: "3",
      sender: "ai",
      text: "Perfect. The interface is optimized for maximum readability and visual feedback.",
      isStreaming: true
    }
  ];

  return (
    <div className="flex-1 flex flex-col pt-8 pb-4 px-4 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
      {/* Messages Feed */}
      <div className="flex-1 space-y-6 overflow-y-auto mb-8 pr-2 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex gap-4 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-md ${
                msg.sender === "user"
                  ? "bg-[var(--color-surface-muted)]"
                  : "bg-gradient-to-tr from-[var(--color-brand-600)] to-[var(--color-accent-500)]"
              }`}>
                {msg.sender === "user" ? (
                  <User className="h-5 w-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <Mic className="h-5 w-5 text-[var(--color-text-inverse)]" />
                )}
              </div>

              {/* Bubble Wrapper */}
              <div className={`group flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`relative rounded-3xl p-4 font-sans text-[17px] leading-relaxed md:p-5 ${
                    msg.sender === "user"
                      ? "rounded-tr-sm border border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                      : "glass rounded-tl-sm border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
                  }`}
                >
                  {msg.text}
                  {msg.isStreaming && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-1.5 inline-block h-4 w-2.5 rounded-[1px] align-middle bg-[var(--color-brand)]"
                    />
                  )}
                </div>

                {/* Micro Actions */}
                <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {msg.sender === "ai" && (
                    <button
                      type="button"
                      className="p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
