import { ScrollView, Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { MONTH_NAMES } from "@shareef-money/shared/constants";
import { useMonthlySummary } from "../queries/use-transactions";

type Props = {
  currentDate: Date;
};

const EMPTY = { income: 0, expense: 0, net: 0 };

export function MonthlyView({ currentDate }: Props) {
  const year = currentDate.getFullYear();
  const { data: months = [] } = useMonthlySummary(year);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-2">
      {MONTH_NAMES.map((name, i) => {
        const summary = months[i] ?? EMPTY;
        const hasActivity = summary.income > 0 || summary.expense > 0;
        return (
          <View
            key={name}
            className="flex-row items-center py-3 border-b border-border"
          >
            <Text className="text-sm text-text w-24">{name}</Text>
            <View className="flex-1 flex-row justify-end gap-4">
              <Text className="text-xs text-income w-24 text-right">
                {summary.income > 0 ? formatCurrency(summary.income) : "-"}
              </Text>
              <Text className="text-xs text-expense w-24 text-right">
                {summary.expense > 0 ? formatCurrency(summary.expense) : "-"}
              </Text>
              <Text
                className={`text-xs font-medium w-24 text-right ${
                  summary.net >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {hasActivity ? formatCurrency(Math.abs(summary.net)) : "-"}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
