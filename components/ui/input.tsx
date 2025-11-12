"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-200 placeholder-neutral-500 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return <input ref={ref} type={type} className={cn(baseClasses, className)} {...props} />;
});
Input.displayName = "Input";
