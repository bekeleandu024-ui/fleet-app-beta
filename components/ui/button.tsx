"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const variantClasses: Record<"subtle" | "primary" | "plain", string> = {
  subtle: "hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,black_20%)]",
  primary:
    "border-[color-mix(in_srgb,var(--brand)_70%,transparent)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_18%,transparent)]",
  plain:
    "border-transparent bg-transparent text-[color-mix(in_srgb,var(--muted)_85%,transparent)] hover:text-[var(--text)]",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "primary" | "plain";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", variant = "subtle", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
