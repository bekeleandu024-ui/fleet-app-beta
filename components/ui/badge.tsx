import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
  {
    variants: {
      variant: {
        default: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/10",
        secondary: "border-slate-700 bg-slate-900/70 text-slate-300 shadow-sm shadow-black/20",
        destructive: "border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-sm shadow-rose-500/10",
        warning: "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
