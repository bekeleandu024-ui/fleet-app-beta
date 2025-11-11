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
    default: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
    brand:
      "border-[color-mix(in_srgb,var(--brand)_60%,transparent)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]",
    ok: "border-[color-mix(in_srgb,var(--ok)_55%,transparent)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-[var(--ok)]",
    warn:
      "border-[color-mix(in_srgb,var(--warn)_55%,transparent)] bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]",
    alert:
      "border-[color-mix(in_srgb,var(--alert)_55%,transparent)] bg-[color-mix(in_srgb,var(--alert)_14%,transparent)] text-[var(--alert)]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-[calc(var(--radius)-2px)] px-3 text-sm font-medium",
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
