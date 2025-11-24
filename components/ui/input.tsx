"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 text-sm text-slate-200 placeholder-slate-500 transition-all duration-200 focus:border-slate-600/80 focus:outline-none focus:ring-2 focus:ring-slate-600/30 focus:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm shadow-black/20";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return <input ref={ref} type={type} className={cn(baseClasses, className)} {...props} />;
});
Input.displayName = "Input";

