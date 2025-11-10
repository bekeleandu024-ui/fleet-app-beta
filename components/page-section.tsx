import { cn } from "@/lib/utils";

type PageSectionProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  hideHeader?: boolean;
};

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  hideHeader = false,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] shadow-sm",
        className
      )}
    >
      {!hideHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">{title}</h2>
            {description ? (
              <p className="text-xs text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-6 py-6", contentClassName)}>{children}</div>
    </section>
  );
}
