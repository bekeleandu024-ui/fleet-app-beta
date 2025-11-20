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
        "flex flex-col gap-4 rounded-xl border border-slate-800/70 bg-slate-900/60 text-slate-300 shadow-lg shadow-black/40 hover:border-emerald-500/30 transition-all duration-200",
        dense ? "p-5" : "p-6",
        className
      )}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-100">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 md:shrink-0">{actions}</div> : null}
      </header>
      <div aria-live={ariaLive ?? undefined} className="space-y-4 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-slate-700/50 pt-4 text-xs text-slate-500">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
