"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// Simple global toast event system
const toastListeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((l) => l({ id, type, message }));
}

const icons: Record<ToastType, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
};

const styles: Record<ToastType, string> = {
  info:
    "border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] bg-[var(--color-brand-muted)] text-[var(--color-brand-dim)]",
  success:
    "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[var(--color-success-muted)] text-[var(--color-success)]",
  error:
    "border-[color-mix(in_srgb,var(--color-error)_40%,transparent)] bg-[var(--color-error-muted)] text-[var(--color-error)]",
  warning:
    "border-[color-mix(in_srgb,var(--color-warning)_40%,transparent)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      const idx = toastListeners.indexOf(handler);
      if (idx !== -1) toastListeners.splice(idx, 1);
    };
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                "pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl",
                "border backdrop-blur-sm max-w-sm shadow-xl",
                styles[toast.type]
              )}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{toast.message}</p>
              <button
                onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}
                className="ml-auto -mr-1 hover:opacity-70 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
