"use client";

import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DrawerFilterSection {
  title: string;
  description?: string;
  fields: ReactNode;
}

interface DrawerFilterProps {
  title: string;
  sections: DrawerFilterSection[];
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
}

export function DrawerFilter({ title, sections, onClear, onApply, className }: DrawerFilterProps) {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          <p className="text-xs text-muted">Refine the working set across the workspace.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted hover:text-[var(--text)]"
          onClick={() => {
            onClear?.();
          }}
        >
          Clear all
        </Button>
      </header>
      <div className="flex-1 space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{section.title}</h4>
              {section.description ? <p className="mt-1 text-xs text-muted">{section.description}</p> : null}
            </div>
            <div className="grid gap-3 text-sm text-[var(--text)]">{section.fields}</div>
          </section>
        ))}
      </div>
      <footer className="flex justify-between gap-2 text-xs">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1 rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-muted"
          onClick={() => {
            onClear?.();
            setOpen(false);
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black"
          onClick={() => {
            onApply?.();
            setOpen(false);
          }}
        >
          Apply
        </Button>
      </footer>
    </div>
  );

  return (
    <div className={cn("col-span-12 lg:col-span-3", className)}>
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          <p className="text-xs text-muted">Filters</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
          onClick={() => setOpen(true)}
        >
          Open
        </Button>
      </div>
      <aside className="hidden h-full rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft lg:block">
        {content}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 flex bg-black/60 lg:hidden">
          <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col gap-6 rounded-l-xl border border-subtle bg-surface-1 p-5 shadow-soft">
            {content}
            <Button
              variant="ghost"
              className="text-xs text-muted hover:text-[var(--text)]"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
