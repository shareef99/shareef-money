import type { DebtLedger } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { Text } from "../ui/text";
import { cn } from "../../lib/cn";

type Props = {
  ledger: DebtLedger;
};

export function DebtSummaryCard({ ledger }: Props) {
  const tiles = [
    { label: "Owed to you", value: ledger.receivable, color: "text-income" },
    { label: "You owe", value: ledger.payable, color: "text-expense" },
    {
      label: "Net",
      value: ledger.net,
      color: ledger.net >= 0 ? "text-income" : "text-expense",
    },
  ];

  return (
    <ChartCard title="Debts">
      <div className="mb-4 grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-card-alt p-3">
            <Text variant="secondary" size="xs">
              {t.label}
            </Text>
            <p className={cn("mt-1 font-bold", t.color)}>{formatCurrency(Math.abs(t.value))}</p>
          </div>
        ))}
      </div>

      {ledger.people.length === 0 ? (
        <ChartEmpty message="No outstanding debts." />
      ) : (
        <ul className="flex flex-col gap-2">
          {ledger.people.slice(0, 8).map((p) => (
            <li key={p.contactId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-text">{p.name}</span>
              <span className={cn("font-medium", p.net >= 0 ? "text-income" : "text-expense")}>
                {p.net >= 0 ? "owes you " : "you owe "}
                {formatCurrency(Math.abs(p.net))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
