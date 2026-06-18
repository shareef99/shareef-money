import { Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { cn } from "../../lib/cn";

export type BudgetItem = {
  id: number;
  name: string;
  color: string | null;
  budget: number;
  actual: number;
};

type Props = { items: BudgetItem[] };

// Budget vs actual per category, as bullet bars. Over-budget turns red.
export function BudgetActualCard({ items }: Props) {
  return (
    <ChartCard title="Budget vs actual" subtitle="this month">
      {items.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No budgets set for this month</Text>
        </View>
      ) : (
        items.map((it) => {
          const pct = it.budget > 0 ? (it.actual / it.budget) * 100 : 0;
          const over = it.actual > it.budget;
          return (
            <View key={it.id} className="py-2">
              <View className="flex-row items-center mb-1">
                <Text className="text-sm text-text flex-1" numberOfLines={1}>
                  {it.name}
                </Text>
                <Text className={cn("text-xs", over ? "text-expense" : "text-text-secondary")}>
                  {formatCurrency(it.actual)} / {formatCurrency(it.budget)}
                </Text>
              </View>
              <View className="h-2.5 rounded-full bg-surface overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: over ? "#E0534C" : it.color ?? "#3FB68B",
                  }}
                />
              </View>
              {over ? (
                <Text className="text-[10px] text-expense mt-0.5">
                  Over by {formatCurrency(it.actual - it.budget)}
                </Text>
              ) : null}
            </View>
          );
        })
      )}
    </ChartCard>
  );
}
