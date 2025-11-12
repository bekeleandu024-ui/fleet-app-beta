"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const variantClasses: Record<"subtle" | "primary" | "plain", string> = {
  subtle: "hover:border-neutral-700 hover:bg-neutral-800",
  primary:
    "border-emerald-400/70 bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400",
  plain:
    "border-transparent bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40",
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
