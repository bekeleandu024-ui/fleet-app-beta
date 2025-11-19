"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-800/60 bg-[#1a1d28] text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

const variantClasses: Record<"subtle" | "primary" | "plain", string> = {
  subtle: "hover:bg-[#1f2330] hover:border-neutral-700",
  primary:
    "border-emerald-500/60 bg-emerald-500 text-white hover:bg-emerald-600",
  plain:
    "border-transparent bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1d28]",
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
