"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 font-medium";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
};

const variantClasses: Record<"subtle" | "primary" | "plain", string> = {
  subtle: "border-slate-700 bg-slate-900/60 hover:bg-slate-800/70 hover:border-slate-600 shadow-md shadow-black/30",
  primary:
    "border-emerald-500/50 bg-emerald-500/30 hover:bg-emerald-500/40 hover:border-emerald-400/70 shadow-lg shadow-emerald-500/20",
  plain:
    "border-transparent bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50",
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
