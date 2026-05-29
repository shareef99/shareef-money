import { Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ALL_TIME_FROM, ALL_TIME_TO } from "@shareef-money/shared/constants";
import { useTransactionsSummary } from "../queries/use-transactions";

export function TotalView() {
  const { data: summary } = useTransactionsSummary(ALL_TIME_FROM, ALL_TIME_TO);

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <View className="w-full gap-6">
        <View className="bg-card rounded-xl p-5">
          <Text className="text-sm text-text-secondary mb-1">Total Income</Text>
          <Text className="text-2xl font-bold text-income">
            {formatCurrency(summary.income)}
          </Text>
        </View>

        <View className="bg-card rounded-xl p-5">
          <Text className="text-sm text-text-secondary mb-1">
            Total Expenses
          </Text>
          <Text className="text-2xl font-bold text-expense">
            {formatCurrency(summary.expense)}
          </Text>
        </View>

        <View className="bg-card rounded-xl p-5">
          <Text className="text-sm text-text-secondary mb-1">Net Total</Text>
          <Text
            className={`text-2xl font-bold ${summary.net >= 0 ? "text-income" : "text-expense"}`}
          >
            {summary.net < 0 ? "-" : ""}
            {formatCurrency(Math.abs(summary.net))}
          </Text>
        </View>
      </View>
    </View>
  );
}
