import { Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { StatsSummary } from "../../services/stats-service";
import { cn } from "../../lib/cn";

type Props = { summary: StatsSummary };

// Top-of-dashboard headline numbers: income, expense, net, savings rate.
export function SummaryCards({ summary }: Props) {
  const savingsPct = Math.round(summary.savingsRate * 100);
  return (
    <View className="mx-4 mb-3 flex-row flex-wrap gap-2">
      <Cell label="Income" value={formatCurrency(summary.income)} tone="income" />
      <Cell label="Expense" value={formatCurrency(summary.expense)} tone="expense" />
      <Cell
        label="Net"
        value={`${summary.net < 0 ? "-" : ""}${formatCurrency(Math.abs(summary.net))}`}
        tone={summary.net >= 0 ? "income" : "expense"}
      />
      <Cell
        label="Savings rate"
        value={`${savingsPct}%`}
        tone={savingsPct >= 0 ? "income" : "expense"}
      />
    </View>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <View
      className="bg-card rounded-xl p-3"
      style={{ width: "48%", flexGrow: 1 }}
    >
      <Text className="text-xs text-text-secondary mb-1">{label}</Text>
      <Text
        className={cn(
          "text-lg font-bold",
          tone === "income" ? "text-income" : "text-expense",
        )}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
