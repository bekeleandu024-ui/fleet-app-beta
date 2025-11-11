"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return <input ref={ref} type={type} className={cn(baseClasses, className)} {...props} />;
});
Input.displayName = "Input";
