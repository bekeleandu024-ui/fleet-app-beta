import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] border border-[color:var(--matte-border)] bg-[var(--matte-bg)] text-sm font-semibold text-[var(--text)] shadow-[var(--shadow-matte)] transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-[color:color-mix(in_srgb,var(--accent)_70%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] data-[state=open]:border-[color:color-mix(in_srgb,var(--accent)_70%,transparent)]",
  {
    variants: {
      variant: {
        default:
          "border-[color:color-mix(in_srgb,var(--accent)_65%,transparent)] bg-[var(--accent)] text-black shadow-none hover:bg-[color-mix(in_srgb,var(--accent)_88%,white_12%)] focus-visible:border-[color:var(--accent)] focus-visible:outline-[var(--accent)]",
        destructive:
          "border-[color:color-mix(in_srgb,var(--alert)_65%,transparent)] bg-[var(--alert)] text-[var(--text)] shadow-none hover:bg-[color-mix(in_srgb,var(--alert)_88%,black_12%)] focus-visible:border-[color:var(--alert)] focus-visible:outline-[var(--alert)]",
        outline:
          "bg-transparent shadow-[var(--shadow-matte)] hover:bg-[color-mix(in_srgb,var(--surface-2)_75%,transparent)]",
        secondary:
          "border-[color:var(--matte-border-strong)] bg-[color-mix(in_srgb,var(--surface-2)_86%,var(--surface-3)_14%)] hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)]",
        ghost:
          "border-transparent bg-transparent shadow-none text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] hover:text-[var(--text)]",
        link: "border-none bg-transparent p-0 shadow-none text-[var(--accent)] underline-offset-4 hover:text-[color-mix(in_srgb,var(--accent)_85%,white_15%)] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
