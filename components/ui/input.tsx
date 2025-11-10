import * as React from "react"

import { cn } from "@/lib/utils"

const inputBaseStyles =
  "flex h-10 w-full rounded-[var(--radius)] border border-[color:var(--matte-border)] bg-[var(--matte-bg)] px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-matte)] transition-colors placeholder:text-[color-mix(in_srgb,var(--muted)_70%,transparent)] focus-visible:border-[color:color-mix(in_srgb,var(--accent)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputBaseStyles, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
