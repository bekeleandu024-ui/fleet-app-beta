import { cn } from "@/lib/utils";

export type HealthStatus = "ok" | "warn" | "alert" | "offline";

const styles: Record<HealthStatus, string> = {
  ok: "bg-[var(--ok)]",
  warn: "bg-[var(--warn)]",
  alert: "bg-[var(--alert)]",
  offline: "bg-muted",
};

interface HealthDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: HealthStatus;
}

export function HealthDot({ status = "ok", className, ...rest }: HealthDotProps) {
  return (
    <span
      aria-hidden="true"
      {...rest}
      className={cn("inline-flex size-2.5 rounded-full", styles[status], className)}
    />
  );
}
