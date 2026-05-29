import { useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useTransactions,
  useTransactionsSummary,
} from "../queries/use-transactions";
import { SummaryBar } from "./summary-bar";
import { formatCurrency } from "@shareef-money/shared/utils";
import { cn } from "../lib/cn";

type Props = {
  monthStart: Date;
  monthEnd: Date;
};

export function DailyView({ monthStart, monthEnd }: Props) {
  const router = useRouter();

  const { data: transactions = [] } = useTransactions({
    dateFrom: monthStart,
    dateTo: monthEnd,
  });

  const { data: summary } = useTransactionsSummary(monthStart, monthEnd);

  const sections = useMemo(() => {
    const grouped = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const date =
        tx.date instanceof Date ? tx.date : new Date(tx.date as number);
      const key = date.toISOString().split("T")[0]!;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(tx);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, data]) => {
        const date = new Date(dateStr);
        const dayIncome = data
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0);
        const dayExpense = data
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0);

        return {
          title: dateStr,
          date,
          income: dayIncome,
          expense: dayExpense,
          data,
        };
      });
  }, [transactions]);

  return (
    <>
      <SummaryBar income={summary.income} expense={summary.expense} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-text-secondary text-base">
              No transactions
            </Text>
            <Text className="text-text-muted text-sm mt-1">
              Tap + to add your first transaction
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const dayStr = section.date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          });
          return (
            <View className="flex-row items-center justify-between px-4 py-2 bg-background">
              <Text className="text-sm font-medium text-text">{dayStr}</Text>
              <View className="flex-row gap-3">
                {section.income > 0 && (
                  <Text className="text-xs text-income">
                    {formatCurrency(section.income)}
                  </Text>
                )}
                {section.expense > 0 && (
                  <Text className="text-xs text-expense">
                    {formatCurrency(section.expense)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center px-4 py-3 bg-background active:bg-card"
            onPress={() =>
              router.push({
                pathname: "/add-transaction",
                params: { id: item.id },
              })
            }
          >
            <Text className="text-xl mr-3">{item.category?.icon ?? "💰"}</Text>
            <View className="flex-1">
              <Text className="text-sm text-text">
                {item.category?.name ?? "Transfer"}
              </Text>
              {item.note ? (
                <Text
                  className="text-xs text-text-muted mt-0.5"
                  numberOfLines={1}
                >
                  {item.note}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text
                className={cn(
                  "text-sm font-medium",
                  item.type === "income" && "text-income",
                  item.type === "expense" && "text-expense",
                  item.type === "transfer" && "text-transfer",
                )}
              >
                {item.type === "expense" ? "-" : ""}
                {formatCurrency(item.amount)}
              </Text>
              <Text className="text-xs text-text-muted">
                {item.account?.name}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </>
  );
}
