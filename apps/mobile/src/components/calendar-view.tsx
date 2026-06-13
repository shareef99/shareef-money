import { Pressable, ScrollView, Text, View } from "react-native";
import { fromSmallestUnit } from "@shareef-money/shared/utils";
import { DAY_LABELS } from "@shareef-money/shared/constants";
import type { Transaction } from "@shareef-money/db/schema";

type Props = {
  currentDate: Date;
  transactions: Pick<Transaction, "date" | "type" | "amount">[];
  onSelectDate: (date: Date) => void;
};

export function CalendarView({ currentDate, transactions, onSelectDate }: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const dailyTotals = new Map<number, { income: number; expense: number }>();
  for (const tx of transactions) {
    const date = tx.date instanceof Date ? tx.date : new Date(tx.date as number);
    const day = date.getDate();
    const current = dailyTotals.get(day) ?? { income: 0, expense: 0 };
    if (tx.type === "income") current.income += tx.amount;
    else if (tx.type === "expense") current.expense += tx.amount;
    dailyTotals.set(day, current);
  }

  const compact = (n: number) =>
    fromSmallestUnit(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const weeks: Array<Array<number | null>> = [];
  let currentWeek: Array<number | null> = Array(startDow).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-row px-2 py-2">
        {DAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="text-xs text-text-muted font-medium">{label}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row px-2">
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} className="flex-1 h-16" />;
            }

            const totals = dailyTotals.get(day);
            const isToday = isCurrentMonth && today.getDate() === day;

            return (
              <Pressable
                key={di}
                className={`flex-1 h-16 items-center border border-border/30 pt-1 ${
                  isToday ? "bg-primary/10" : ""
                }`}
                onPress={() => {
                  const d = new Date(year, month, day);
                  onSelectDate(d);
                }}
              >
                <Text
                  className={`text-xs ${isToday ? "text-primary font-bold" : "text-text"}`}
                >
                  {day}
                </Text>
                <View className="flex-1 justify-end pb-0.5">
                  {totals && totals.income > 0 && (
                    <Text className="text-[9px] text-income" numberOfLines={1}>
                      {compact(totals.income)}
                    </Text>
                  )}
                  {totals && totals.expense > 0 && (
                    <Text className="text-[9px] text-expense" numberOfLines={1}>
                      {compact(totals.expense)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
