import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--color-secondary))]", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full rounded-full transition-all duration-500 ease-out",
        value >= 100
          ? "bg-emerald-500"
          : value >= 70
          ? "bg-[hsl(var(--color-primary))]"
          : value >= 40
          ? "bg-amber-500"
          : "bg-red-500",
        indicatorClassName
      )}
      style={{ width: `${Math.min(value || 0, 100)}%` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
