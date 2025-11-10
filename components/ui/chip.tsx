import * as React from "react"

import { cn } from "@/lib/utils"

function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius)] border border-[color:var(--matte-border)] bg-[var(--matte-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] shadow-[var(--shadow-matte)]",
        "focus-visible:border-[color:color-mix(in_srgb,var(--accent)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        className
      )}
      {...props}
    />
  )
}

export { Chip }
