import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";

export type RankedItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  items: RankedItem[];
  emptyMessage?: string;
  limit?: number;
};

// Horizontal proportional bars — reused for transfers, top locations and people.
export function RankedBarCard({ title, subtitle, items, emptyMessage, limit = 8 }: Props) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((i) => i.value), 1);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {shown.length === 0 ? (
        <ChartEmpty message={emptyMessage} />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((item) => (
            <li key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-text">{item.label}</span>
                <span className="shrink-0 font-medium text-text">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-card-alt">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((item.value / max) * 100, 2)}%`,
                    backgroundColor: item.color ?? "var(--primary)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
