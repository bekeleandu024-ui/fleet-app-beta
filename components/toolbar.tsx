import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { StatChip, type StatChipProps } from "@/components/stat-chip";

export type ToolbarStat = StatChipProps & { id?: string };

interface ToolbarProps {
  title: string;
  description?: string;
  stats?: ToolbarStat[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Toolbar({
  title,
  description,
  stats = [],
  actions,
  children,
  className,
}: ToolbarProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "col-span-12 flex flex-col gap-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 text-neutral-200 shadow-lg shadow-black/40",
        className
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-6 text-neutral-100">{title}</h2>
          {description ? <p className="mt-1 text-sm text-neutral-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {stats.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat) => (
            <StatChip key={stat.id ?? stat.label} {...stat} />
          ))}
        </div>
      ) : null}
      {children ? <div className="grid gap-4 md:grid-cols-2">{children}</div> : null}
    </section>
  );
}

