"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type SectionBannerProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  dense?: boolean;
  id?: string;
  children: React.ReactNode;
  className?: string;
  "aria-live"?: React.AriaAttributes["aria-live"];
};

export function SectionBanner({
  title,
  subtitle,
  actions,
  footer,
  dense = false,
  id,
  children,
  className,
  "aria-live": ariaLive,
}: SectionBannerProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] shadow-flat",
        dense ? "p-4" : "p-6",
        "flex flex-col gap-4",
        className
      )}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
          {subtitle ? <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 md:shrink-0">{actions}</div> : null}
      </header>
      <div aria-live={ariaLive ?? undefined} className="space-y-4 text-sm leading-6 text-[var(--text)]">
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-[var(--border)] pt-4 text-xs text-[color-mix(in_srgb,var(--muted)_82%,transparent)]">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
