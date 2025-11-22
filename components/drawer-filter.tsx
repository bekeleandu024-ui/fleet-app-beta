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
    <div className="flex h-full flex-col gap-6 overflow-y-auto text-neutral-300">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
          <p className="text-xs text-neutral-400">
            Refine the working set across the workspace.
          </p>
        </div>
        <Button
          variant="plain"
          size="sm"
          className="text-xs text-neutral-500 hover:text-neutral-200"
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
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {section.title}
              </h4>
              {section.description ? <p className="mt-1 text-xs text-neutral-500">{section.description}</p> : null}
            </div>
            <div className="grid gap-3 text-sm text-neutral-200">{section.fields}</div>
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
      <div className="mb-4 flex items-center justify-between text-neutral-300 lg:hidden">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
          <p className="text-xs text-neutral-500">Filters</p>
        </div>
        <Button variant="subtle" size="sm" className="text-xs uppercase tracking-wide" onClick={() => setOpen(true)}>
          Open
        </Button>
      </div>
      <aside className="hidden h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg shadow-black/40 lg:block">
        {content}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur lg:hidden">
          <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col gap-6 rounded-l-xl border border-neutral-800 bg-neutral-950/90 p-5 text-neutral-200 shadow-2xl shadow-black/50">
            {content}
            <Button
              variant="plain"
              className="text-xs text-neutral-500 hover:text-neutral-200"
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

