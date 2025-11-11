"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 pr-10 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select ref={ref} className={cn(baseClasses, className)} {...props}>
          {placeholder ? <option value="" hidden>{placeholder}</option> : null}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
    );
  }
);
Select.displayName = "Select";
