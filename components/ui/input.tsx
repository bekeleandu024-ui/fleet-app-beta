"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full rounded-xl border border-zinc-800 bg-black/20 px-4 text-sm text-zinc-300 placeholder-zinc-600 transition-all duration-200 focus:border-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:bg-black/40 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm shadow-black/20";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return <input ref={ref} type={type} className={cn(baseClasses, className)} {...props} />;
});
Input.displayName = "Input";

