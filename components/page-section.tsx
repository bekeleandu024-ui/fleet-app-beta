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
        "rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 shadow-lg shadow-black/40",
        className
      )}
    >
      {!hideHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-800 px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-100">{title}</h2>
            {description ? <p className="text-xs text-neutral-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("px-6 py-6", contentClassName)}>{children}</div>
    </section>
  );
}
