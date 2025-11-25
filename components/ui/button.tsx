"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full border text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/50 disabled:cursor-not-allowed disabled:opacity-50 font-medium";

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
};

const variantClasses: Record<"subtle" | "primary" | "plain", string> = {
  subtle: "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 shadow-md shadow-black/30 text-zinc-300",
  primary:
    "border-blue-800/50 bg-blue-950/50 hover:bg-blue-900/50 text-blue-200 hover:border-blue-700/50 shadow-lg shadow-blue-900/20",
  plain:
    "border-transparent bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "primary" | "plain";
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", variant = "subtle", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Default type="button" only for button elements (not asChild)
    const elementProps = { ...props };
    if (!asChild && !elementProps.type) {
      elementProps.type = "button";
    }

    return (
      <Comp
        ref={ref}
        className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...elementProps}
      />
    );
  }
);
Button.displayName = "Button";

