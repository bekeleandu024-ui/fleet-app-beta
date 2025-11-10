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
  default: "border-subtle bg-surface-3/60 text-[var(--text)]",
  ok: "border-[color-mix(in_srgb,var(--ok)_35%,transparent)] bg-[color-mix(in_srgb,var(--ok)_18%,transparent)] text-[var(--ok)]",
  warn: "border-[color-mix(in_srgb,var(--warn)_35%,transparent)] bg-[color-mix(in_srgb,var(--warn)_18%,transparent)] text-[var(--warn)]",
  alert:
    "border-[color-mix(in_srgb,var(--alert)_35%,transparent)] bg-[color-mix(in_srgb,var(--alert)_18%,transparent)] text-[var(--alert)]",
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
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {icon ? <span className="inline-flex items-center text-[var(--text)]">{icon}</span> : null}
      <span className="text-muted">{label}</span>
      {value !== undefined ? <span className="text-[var(--text)]">{value}</span> : null}
    </span>
  );
}
