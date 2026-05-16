import { forwardRef } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] active:bg-[var(--color-brand-700)] " +
    "text-[var(--color-text-inverse)] shadow-lg shadow-[color-mix(in_srgb,var(--color-brand-900)_30%,transparent)]",
  secondary:
    "bg-surface-raised hover:bg-surface-overlay border border-[var(--color-border-strong)] text-[var(--color-text-primary)]",
  ghost:
    "border border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-text-primary)_12%,transparent)] active:scale-[0.97]",
  danger:
    "bg-[var(--color-error)] hover:opacity-90 active:opacity-95 text-[var(--color-text-inverse)]",
  success:
    "bg-[var(--color-success)] hover:opacity-90 active:opacity-95 text-[var(--color-text-inverse)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", isLoading, className, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-400)] focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
