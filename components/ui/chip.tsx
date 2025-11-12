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
    default: "border-neutral-800 bg-neutral-900/60 text-neutral-200",
    brand: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
    ok: "border-emerald-400/60 bg-emerald-500/10 text-emerald-300",
    warn: "border-amber-500/60 bg-amber-500/10 text-amber-300",
    alert: "border-rose-500/60 bg-rose-500/10 text-rose-300",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
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
