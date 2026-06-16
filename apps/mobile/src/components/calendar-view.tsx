import { Pressable, Text, View } from "react-native";
import { fromSmallestUnit } from "@shareef-money/shared/utils";
import type { Transaction } from "@shareef-money/db/schema";
import { useSettings } from "../queries/use-settings";
import { weekdayLabels } from "../lib/period";

type Props = {
  currentDate: Date;
  transactions: Pick<Transaction, "date" | "type" | "amount">[];
  onSelectDate: (date: Date) => void;
};

export function CalendarView({ currentDate, transactions, onSelectDate }: Props) {
  const { data: settings } = useSettings();
  const weekStart = settings.weekStartDay;
  const dayLabels = weekdayLabels(weekStart);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const dow = firstDay.getDay(); // 0 = Sunday
  const startDow = weekStart === "monday" ? (dow + 6) % 7 : dow;

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
    <View className="flex-1 bg-background">
      <View className="flex-row px-2 py-2">
        {dayLabels.map((label, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-xs text-text-muted font-medium">{label}</Text>
          </View>
        ))}
      </View>
      <View className="flex-1 px-2 pb-2">
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row flex-1">
            {week.map((day, di) => {
              if (day === null) {
                return <View key={di} className="flex-1" />;
              }

              const totals = dailyTotals.get(day);
              const isToday = isCurrentMonth && today.getDate() === day;

              return (
                <Pressable
                  key={di}
                  className={`flex-1 items-center border border-border/30 pt-1 ${
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
                  <View className="flex-1 justify-end pb-1">
                    {totals && totals.income > 0 && (
                      <Text className="text-[10px] text-income" numberOfLines={1}>
                        {compact(totals.income)}
                      </Text>
                    )}
                    {totals && totals.expense > 0 && (
                      <Text className="text-[10px] text-expense" numberOfLines={1}>
                        {compact(totals.expense)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
