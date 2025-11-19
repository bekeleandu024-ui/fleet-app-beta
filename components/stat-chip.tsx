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
  default: "bg-neutral-800/40 text-neutral-400",
  ok: "bg-emerald-500/15 text-emerald-400",
  warn: "bg-amber-500/15 text-amber-400",
  alert: "bg-rose-500/15 text-rose-400",
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
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
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
