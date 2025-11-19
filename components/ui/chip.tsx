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
    default: "bg-neutral-800/40 text-neutral-400",
    brand: "bg-emerald-500/15 text-emerald-400",
    ok: "bg-emerald-500/15 text-emerald-400",
    warn: "bg-amber-500/15 text-amber-400",
    alert: "bg-rose-500/15 text-rose-400",
    neutral: "bg-neutral-700/30 text-neutral-400",
  }[tone] || toneClass.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
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
