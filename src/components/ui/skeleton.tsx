import { cn } from "@/lib/utils";

function Skeleton({
  className,
  fullscreen,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { fullscreen?: boolean }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        fullscreen && "min-h-[80vh]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
