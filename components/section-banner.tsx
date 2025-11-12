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
        "flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 shadow-lg shadow-black/40",
        dense ? "p-4" : "p-6",
        className
      )}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-neutral-100">{title}</h2>
          {subtitle ? <p className="text-sm text-neutral-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 md:shrink-0">{actions}</div> : null}
      </header>
      <div aria-live={ariaLive ?? undefined} className="space-y-4 text-sm leading-6 text-neutral-300">
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-neutral-800 pt-4 text-xs text-neutral-500">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
