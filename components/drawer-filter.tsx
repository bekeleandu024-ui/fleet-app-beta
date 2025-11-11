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
          <p className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
            Refine the working set across the workspace.
          </p>
        </div>
        <Button
          variant="plain"
          size="sm"
          className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)] hover:text-[var(--text)]"
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
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
                {section.title}
              </h4>
              {section.description ? (
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{section.description}</p>
              ) : null}
            </div>
            <div className="grid gap-3 text-sm text-[var(--text)]">{section.fields}</div>
          </section>
        ))}
      </div>
      <footer className="flex justify-between gap-2 text-xs">
        <Button
          type="button"
          variant="subtle"
          size="sm"
          className="flex-1"
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
          variant="primary"
          className="flex-1"
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
          <p className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Filters</p>
        </div>
        <Button variant="subtle" size="sm" className="text-xs uppercase tracking-wide" onClick={() => setOpen(true)}>
          Open
        </Button>
      </div>
      <aside className="hidden h-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-flat lg:block">
        {content}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 flex bg-black/60 lg:hidden">
          <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col gap-6 rounded-l-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-flat">
            {content}
            <Button
              variant="plain"
              className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)] hover:text-[var(--text)]"
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
