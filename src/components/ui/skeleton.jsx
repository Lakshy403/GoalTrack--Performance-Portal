import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[hsl(var(--color-muted))]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
