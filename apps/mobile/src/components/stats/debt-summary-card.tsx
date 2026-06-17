import { Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useDebtLedger } from "../../queries/use-debts";
import { ChartCard } from "./chart-card";
import { cn } from "../../lib/cn";

// Debts are running balances (not range-bound), so this shows the current
// position across all people rather than the selected period.
export function DebtSummaryCard() {
  const { data } = useDebtLedger();

  if (data.people.length === 0) return null;

  return (
    <ChartCard title="Debts" subtitle="who owes whom right now">
      <View className="flex-row mb-3">
        <View className="flex-1">
          <Text className="text-xs text-text-secondary mb-1">Owed to you</Text>
          <Text className="text-base font-bold text-income">
            {formatCurrency(data.receivable)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-text-secondary mb-1">You owe</Text>
          <Text className="text-base font-bold text-expense">
            {formatCurrency(data.payable)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-text-secondary mb-1">Net</Text>
          <Text
            className={cn(
              "text-base font-bold",
              data.net >= 0 ? "text-income" : "text-expense",
            )}
          >
            {data.net < 0 ? "-" : ""}
            {formatCurrency(Math.abs(data.net))}
          </Text>
        </View>
      </View>

      {data.people.slice(0, 8).map((p) => {
        const owesYou = p.net > 0;
        return (
          <View
            key={p.contactId}
            className="flex-row items-center justify-between py-1.5"
          >
            <Text className="text-sm text-text flex-1" numberOfLines={1}>
              {p.name}
            </Text>
            <Text className="text-xs text-text-muted mr-2">
              {owesYou ? "owes you" : "you owe"}
            </Text>
            <Text
              className={cn(
                "text-sm font-medium",
                owesYou ? "text-income" : "text-expense",
              )}
            >
              {formatCurrency(Math.abs(p.net))}
            </Text>
          </View>
        );
      })}
    </ChartCard>
  );
}
