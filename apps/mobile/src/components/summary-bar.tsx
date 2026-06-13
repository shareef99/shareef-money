import { View, Text } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";

type Props = {
  income: number;
  expense: number;
  // When carry-forward is enabled, the leftover balance brought in from prior
  // months. Folded into the Total and shown as a small note.
  carriedForward?: number;
};

export function SummaryBar({ income, expense, carriedForward }: Props) {
  const net = income - expense + (carriedForward ?? 0);

  return (
    <View className="bg-surface border-b border-border">
      <View className="flex-row justify-between px-4 py-3">
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
            {net < 0 ? "-" : ""}
            {formatCurrency(Math.abs(net))}
          </Text>
        </View>
      </View>
      {carriedForward != null && carriedForward !== 0 && (
        <Text className="text-[11px] text-text-muted text-center pb-1.5">
          Brought forward: {carriedForward < 0 ? "-" : ""}
          {formatCurrency(Math.abs(carriedForward))}
        </Text>
      )}
    </View>
  );
}
