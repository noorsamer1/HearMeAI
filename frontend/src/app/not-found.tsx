import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-8xl font-bold text-gradient">404</p>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Page not found
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-[var(--color-text-inverse)] text-sm font-medium transition-opacity"
        >
          <Home className="w-4 h-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
