import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

type SectionBannerProps = {
  children: ReactNode;
  className?: string;
};

type SectionBannerHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type SectionBannerContentProps = {
  children: ReactNode;
  className?: string;
};

type SectionBannerFooterProps = {
  children: ReactNode;
  className?: string;
};

type SectionBannerComponent = ((props: SectionBannerProps) => JSX.Element) & {
  Header: (props: SectionBannerHeaderProps) => JSX.Element | null;
  Content: (props: SectionBannerContentProps) => JSX.Element;
  Footer: (props: SectionBannerFooterProps) => JSX.Element | null;
};

const SectionBanner = (({ children, className }: SectionBannerProps) => {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] shadow-flat",
        className
      )}
    >
      {children}
    </section>
  );
}) as SectionBannerComponent;

function SectionBannerHeader({
  title,
  description,
  actions,
  children,
  className,
}: SectionBannerHeaderProps) {
  if (!title && !description && !actions && children === undefined) {
    return null;
  }

  if (children !== undefined) {
    return (
      <header
        className={cn(
          "flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-6 py-4",
          className
        )}
      >
        {children}
      </header>
    );
  }

  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-6 py-4",
        className
      )}
    >
      <div className="space-y-1">
        {title ? (
          <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">{title}</h2>
        ) : null}
        {description ? (
          <p className="text-xs text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function SectionBannerContent({ children, className }: SectionBannerContentProps) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

function SectionBannerFooter({ children, className }: SectionBannerFooterProps) {
  if (!children) {
    return null;
  }

  return (
    <footer
      className={cn(
        "border-t border-[var(--border)] px-6 py-4 text-xs text-[var(--muted)]",
        className
      )}
    >
      {children}
    </footer>
  );
}

SectionBanner.Header = SectionBannerHeader;
SectionBanner.Content = SectionBannerContent;
SectionBanner.Footer = SectionBannerFooter;

export { SectionBanner };

