import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StatChipProps {
  label: string;
  value?: string | number;
  variant?: "default" | "ok" | "warn" | "alert";
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

const variantStyles: Record<Required<StatChipProps>["variant"], string> = {
  default: "border-neutral-800 bg-neutral-900/60 text-neutral-200",
  ok: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  warn: "border-amber-500/60 bg-amber-500/10 text-amber-300",
  alert: "border-rose-500/60 bg-rose-500/10 text-rose-300",
};

export function StatChip({
  label,
  value,
  variant = "default",
  icon,
  ariaLabel,
  className,
}: StatChipProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel ?? `${label}${value !== undefined ? `: ${value}` : ""}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {icon ? <span className="inline-flex items-center text-current">{icon}</span> : null}
      <span className="text-neutral-400">{label}</span>
      {value !== undefined ? <span className="text-neutral-100">{value}</span> : null}
    </span>
  );
}
