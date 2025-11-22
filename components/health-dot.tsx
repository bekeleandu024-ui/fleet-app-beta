import { cn } from "@/lib/utils";

export type HealthStatus = "ok" | "warn" | "alert" | "offline";

const styles: Record<HealthStatus, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  alert: "bg-rose-500",
  offline: "bg-neutral-700",
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

