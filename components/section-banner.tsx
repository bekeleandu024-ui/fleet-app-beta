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
        "flex flex-col gap-3 rounded-lg border border-neutral-800/60 bg-[#151820] text-neutral-200",
        dense ? "p-4" : "p-5",
        className
      )}
    >
      <header className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
          {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 md:shrink-0">{actions}</div> : null}
      </header>
      <div aria-live={ariaLive ?? undefined} className="space-y-3 text-sm leading-relaxed text-neutral-300">
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-neutral-800/40 pt-3 text-xs text-neutral-500">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
