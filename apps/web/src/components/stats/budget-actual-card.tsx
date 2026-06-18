import { effectiveBudget, type BudgetData } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { cn } from "../../lib/cn";
import type { Category } from "../../lib/types";

type Props = {
  budgets: BudgetData;
  monthKey: string;
  actualByCategory: Map<number, number>;
  categories: Category[];
};

export function BudgetActualCard({ budgets, monthKey, actualByCategory, categories }: Props) {
  const catById = new Map(categories.map((c) => [c.id, c]));

  const ids = new Set<number>();
  Object.keys(budgets.default).forEach((k) => ids.add(Number(k)));
  Object.keys(budgets.months[monthKey] ?? {}).forEach((k) => ids.add(Number(k)));

  const rows = [...ids]
    .map((id) => ({
      id,
      name: catById.get(id)?.name ?? "Category",
      color: catById.get(id)?.color ?? "var(--primary)",
      budget: effectiveBudget(budgets, monthKey, id),
      actual: actualByCategory.get(id) ?? 0,
    }))
    .filter((r) => r.budget > 0)
    .sort((a, b) => b.actual - a.actual);

  return (
    <ChartCard title="Budget vs actual" subtitle="this month">
      {rows.length === 0 ? (
        <ChartEmpty message="Set monthly budgets in the Budgets tab to track them here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const over = r.actual > r.budget;
            const pct = Math.min((r.actual / r.budget) * 100, 100);
            return (
              <li key={r.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-text">{r.name}</span>
                  <span className={cn("shrink-0 font-medium", over ? "text-expense" : "text-text")}>
                    {formatCurrency(r.actual)}{" "}
                    <span className="text-text-muted">/ {formatCurrency(r.budget)}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-alt">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: over ? "var(--expense)" : r.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
