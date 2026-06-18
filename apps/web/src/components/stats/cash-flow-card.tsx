import type { CashFlow } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { cn } from "../../lib/cn";

type Props = {
  cashFlow: CashFlow;
};

export function CashFlowCard({ cashFlow }: Props) {
  const rows = [
    { label: "Opening balance", value: cashFlow.opening, sign: "", color: "text-text" },
    { label: "Income", value: cashFlow.income, sign: "+", color: "text-income" },
    { label: "Expense", value: cashFlow.expense, sign: "−", color: "text-expense" },
    ...(cashFlow.fees > 0
      ? [{ label: "Fees", value: cashFlow.fees, sign: "−", color: "text-expense" }]
      : []),
  ];

  return (
    <ChartCard title="Cash flow" subtitle="this period">
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between border-b border-divider py-2 text-sm"
          >
            <span className="text-text-secondary">{r.label}</span>
            <span className={cn("font-medium", r.color)}>
              {r.sign}
              {formatCurrency(r.value)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between pt-3 text-sm">
          <span className="font-semibold text-text">Closing balance</span>
          <span
            className={cn(
              "text-base font-bold",
              cashFlow.closing >= 0 ? "text-text" : "text-expense",
            )}
          >
            {formatCurrency(cashFlow.closing)}
          </span>
        </li>
      </ul>
    </ChartCard>
  );
}
