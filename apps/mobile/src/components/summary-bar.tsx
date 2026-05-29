import { View, Text } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";

type Props = {
  income: number;
  expense: number;
};

export function SummaryBar({ income, expense }: Props) {
  const net = income - expense;

  return (
    <View className="flex-row justify-between px-4 py-3 bg-surface border-b border-border">
      <View className="items-center flex-1">
        <Text className="text-xs text-text-secondary mb-0.5">Income</Text>
        <Text className="text-sm font-medium text-income">
          {formatCurrency(income)}
        </Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-xs text-text-secondary mb-0.5">Expenses</Text>
        <Text className="text-sm font-medium text-expense">
          {formatCurrency(expense)}
        </Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-xs text-text-secondary mb-0.5">Total</Text>
        <Text
          className={`text-sm font-medium ${net >= 0 ? "text-income" : "text-expense"}`}
        >
          {formatCurrency(Math.abs(net))}
        </Text>
      </View>
    </View>
  );
}
