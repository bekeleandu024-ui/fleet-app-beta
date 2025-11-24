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
    default: "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 shadow-sm shadow-black/20",
    brand: "bg-emerald-500/10 text-emerald-500/80 border border-emerald-500/20 shadow-sm shadow-black/10",
    ok: "bg-emerald-500/10 text-emerald-500/80 border border-emerald-500/20 shadow-sm shadow-black/10",
    warn: "bg-amber-500/10 text-amber-500/80 border border-amber-500/20 shadow-sm shadow-black/10",
    alert: "bg-rose-500/10 text-rose-500/80 border border-rose-500/20 shadow-sm shadow-black/10",
    neutral: "bg-neutral-700/40 text-neutral-400 border border-neutral-700/50 shadow-sm shadow-black/20",
  }[tone] || toneClass.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all duration-200",
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

