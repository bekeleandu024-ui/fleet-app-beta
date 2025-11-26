"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

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
  collapsible?: boolean;
  defaultOpen?: boolean;
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
  collapsible = false,
  defaultOpen = true,
}: SectionBannerProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <section
      id={id}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-neutral-800 bg-black text-zinc-300 shadow-lg shadow-black/60 hover:border-neutral-700 transition-all duration-200",
        dense ? "p-5" : "p-6",
        className
      )}
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 flex-1">
          {collapsible && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="mt-1 rounded-md p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
            >
              <ChevronDown
                className={cn("size-5 transition-transform duration-200", isOpen ? "rotate-0" : "-rotate-90")}
              />
            </button>
          )}
          <div className="space-y-1">
            <h2 
              className={cn("text-base font-bold text-zinc-100", collapsible && "cursor-pointer select-none")}
              onClick={() => collapsible && setIsOpen(!isOpen)}
            >
              {title}
            </h2>
            {subtitle ? <p className="text-xs text-zinc-400">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 md:shrink-0">{actions}</div> : null}
      </header>
      
      {(!collapsible || isOpen) && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div aria-live={ariaLive ?? undefined} className="space-y-4 text-sm leading-relaxed text-zinc-300">
            {children}
          </div>
          {footer ? (
            <footer className="border-t border-zinc-700/50 pt-4 text-xs text-zinc-500 mt-4">
              {footer}
            </footer>
          ) : null}
        </div>
      )}
    </section>
  );
}

