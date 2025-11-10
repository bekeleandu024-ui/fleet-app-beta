import * as React from "react"

import { cn } from "@/lib/utils"

const selectBaseStyles =
  "flex h-10 w-full appearance-none rounded-[var(--radius)] border border-[color:var(--matte-border)] bg-[var(--matte-bg)] px-3 pr-10 text-sm text-[var(--text)] shadow-[var(--shadow-matte)] transition-colors focus-visible:border-[color:color-mix(in_srgb,var(--accent)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(selectBaseStyles, className)}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
