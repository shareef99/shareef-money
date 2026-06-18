import type { ReactNode } from "react";
import { Text } from "../ui/text";
import { ChartBoundary } from "../ui/chart-boundary";
import { cn } from "../../lib/cn";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, right, className, children }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text weight="semibold" size="base">
            {title}
          </Text>
          {subtitle && (
            <Text variant="secondary" size="xs">
              {subtitle}
            </Text>
          )}
        </div>
        {right}
      </header>
      <ChartBoundary>{children}</ChartBoundary>
    </section>
  );
}
