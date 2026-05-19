import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-ring))] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]",
        secondary: "border-transparent bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))]",
        destructive: "border-transparent bg-[hsl(var(--color-destructive))] text-[hsl(var(--color-destructive-foreground))]",
        outline: "text-[hsl(var(--color-foreground))]",
        success: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        info: "border-transparent bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
