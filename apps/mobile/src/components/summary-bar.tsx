import { View, Text } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";

type Props = {
  income: number;
  expense: number;
  // When carry-forward is enabled, the leftover balance brought in from prior
  // months. It is added into the displayed Income figure.
  carriedForward?: number;
};

export function SummaryBar({ income, expense, carriedForward }: Props) {
  const carry = carriedForward ?? 0;
  const displayIncome = income + carry;
  const net = displayIncome - expense;

  return (
    <View className="bg-surface border-b border-border">
      <View className="flex-row justify-between px-4 py-3">
        <View className="items-center flex-1">
          <Text className="text-xs text-text-secondary mb-0.5">Income</Text>
          <Text className="text-sm font-medium text-income">
            {formatCurrency(displayIncome)}
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
            {net < 0 ? "-" : ""}
            {formatCurrency(Math.abs(net))}
          </Text>
        </View>
      </View>
      {carry !== 0 && (
        <Text className="text-[11px] text-text-muted text-center pb-1.5">
          Income includes {carry < 0 ? "-" : ""}
          {formatCurrency(Math.abs(carry))} brought forward
        </Text>
      )}
    </View>
  );
}
