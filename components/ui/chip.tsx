"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "brand" | "ok" | "warn" | "alert";
  leadingIcon?: React.ReactNode;
};

export function Chip({
  className,
  tone = "default",
  leadingIcon,
  children,
  ...props
}: ChipProps) {
  const toneClass = {
    default: "bg-slate-800/50 text-slate-400 border border-slate-700/50 shadow-sm shadow-black/20",
    brand: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    ok: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    warn: "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10",
    alert: "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/10",
    neutral: "bg-slate-700/40 text-slate-400 border border-slate-700/50 shadow-sm shadow-black/20",
  }[tone] || toneClass.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
        toneClass,
        className
      )}
      {...props}
    >
      {leadingIcon ? <span className="text-current">{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
