"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-muted)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            An unexpected error occurred. Please try refreshing the page.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-[var(--color-text-inverse)] text-sm font-medium transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
