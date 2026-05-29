import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { MONTH_NAMES } from "@shareef-money/shared/constants";
import { useTransactionsSummary } from "../queries/use-transactions";

type Props = {
  currentDate: Date;
};

function MonthRow({
  name,
  year,
  index,
}: {
  name: string;
  year: number;
  index: number;
}) {
  const from = useMemo(() => new Date(year, index, 1), [year, index]);
  const to = useMemo(
    () => new Date(year, index + 1, 0, 23, 59, 59, 999),
    [year, index],
  );
  const { data: summary } = useTransactionsSummary(from, to);

  return (
    <View className="flex-row items-center py-3 border-b border-border">
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
          {summary.income > 0 || summary.expense > 0
            ? formatCurrency(Math.abs(summary.net))
            : "-"}
        </Text>
      </View>
    </View>
  );
}

export function MonthlyView({ currentDate }: Props) {
  const year = currentDate.getFullYear();

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-2">
      {MONTH_NAMES.map((name, i) => (
        <MonthRow key={name} name={name} year={year} index={i} />
      ))}
    </ScrollView>
  );
}
