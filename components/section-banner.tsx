"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionBannerProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SectionBanner({ title, description, children, footer, className }: SectionBannerProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text)] shadow-soft",
        className
      )}
    >
      <header className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</h2>
        {description ? <p className="text-xs text-[var(--muted)]/90">{description}</p> : null}
      </header>
      <div className="space-y-4 text-sm text-[var(--text)]">{children}</div>
      {footer ? <footer className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">{footer}</footer> : null}
    </aside>
  );
}
