import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "processing";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] text-[var(--color-text-secondary)]",
  success: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  error: "bg-[var(--color-error-muted)] text-[var(--color-error)]",
  info: "bg-[var(--color-brand-muted)] text-[var(--color-brand-dim)]",
  processing: "bg-[var(--color-accent-muted)] text-[var(--color-accent-dim)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-text-muted)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  error: "bg-[var(--color-error)]",
  info: "bg-[var(--color-brand)]",
  processing: "bg-[var(--color-accent)]",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            dotColors[variant],
            variant === "processing" && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
