import type { StatsSummary } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { Text } from "../ui/text";
import { cn } from "../../lib/cn";

type Props = {
  summary: StatsSummary;
};

export function SummaryCards({ summary }: Props) {
  const tiles = [
    { label: "Income", value: formatCurrency(summary.income), color: "text-income" },
    { label: "Expense", value: formatCurrency(summary.expense), color: "text-expense" },
    {
      label: "Net",
      value: formatCurrency(summary.net),
      color: summary.net >= 0 ? "text-income" : "text-expense",
    },
    {
      label: "Savings rate",
      value: `${Math.round(summary.savingsRate * 100)}%`,
      color: summary.savingsRate >= 0 ? "text-text" : "text-expense",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-border bg-card p-4">
          <Text variant="secondary" size="xs">
            {t.label}
          </Text>
          <p className={cn("mt-1 text-xl font-bold", t.color)}>{t.value}</p>
        </div>
      ))}
    </div>
  );
}
