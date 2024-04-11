import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-muted h-32 w-full rounded-xl", className)}
      {...props}
    />
  );
}

export { Skeleton };
