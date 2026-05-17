"use client";

import { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/common/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "primary",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => confirmRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
          role="presentation"
          onClick={() => {
            if (!isLoading) onCancel();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background:
                  variant === "danger"
                    ? "color-mix(in srgb, var(--color-error) 14%, transparent)"
                    : "var(--color-brand-muted)",
                border:
                  variant === "danger"
                    ? "1px solid color-mix(in srgb, var(--color-error) 35%, transparent)"
                    : "1px solid color-mix(in srgb, var(--color-brand) 35%, transparent)",
              }}
            >
              <AlertTriangle
                className="h-6 w-6"
                style={{
                  color: variant === "danger" ? "var(--color-error)" : "var(--color-brand)",
                }}
                aria-hidden
              />
            </motion.div>

            <h2
              id={titleId}
              className="text-center text-lg font-bold font-heading"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h2>
            <p
              id={descId}
              className="mt-2 text-center text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {description}
            </p>

            <motion.div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="sm:min-w-[6.5rem]"
              >
                {cancelLabel}
              </Button>
              <Button
                ref={confirmRef}
                type="button"
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={() => void onConfirm()}
                isLoading={isLoading}
                className="sm:min-w-[6.5rem]"
              >
                {confirmLabel}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
