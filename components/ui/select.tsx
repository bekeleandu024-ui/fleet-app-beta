"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full appearance-none rounded-md border border-neutral-700 bg-neutral-900 px-3 pr-10 text-sm text-neutral-200 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-70";

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
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
      </div>
    );
  }
);
Select.displayName = "Select";
