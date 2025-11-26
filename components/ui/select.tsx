"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const baseClasses =
  "h-11 w-full appearance-none rounded-md border border-zinc-800 bg-black/20 px-4 pr-10 text-sm text-zinc-300 transition-all duration-200 focus:border-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:bg-black/40 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm shadow-black/20";

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
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
      </div>
    );
  }
);
Select.displayName = "Select";

