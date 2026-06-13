import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useCategoryBreakdown } from "../../../../queries/use-transactions";
import { DonutChart } from "../../../../components/donut-chart";
import { chartColor } from "../../../../lib/chart-colors";
import { cn } from "../../../../lib/cn";

type StatsType = "income" | "expense";

export default function StatsScreen() {
  const [type, setType] = useState<StatsType>("expense");
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

  const { data } = useCategoryBreakdown(type, monthStart, monthEnd);

  const rows = useMemo(
    () =>
      data.rows.map((row, i) => ({
        ...row,
        color: chartColor(i),
        pct: data.total > 0 ? (row.total / data.total) * 100 : 0,
      })),
    [data],
  );

  const slices = useMemo(
    () => rows.map((r) => ({ value: r.total, color: r.color })),
    [rows],
  );

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={20} className="text-text" />
          </Pressable>
          <Text className="text-base font-semibold text-text">{monthLabel}</Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
            <ChevronRight size={20} className="text-text" />
          </Pressable>
        </View>

        <View className="flex-row mx-4 mb-2 bg-card rounded-lg p-1">
          {(["income", "expense"] as const).map((t) => (
            <Pressable
              key={t}
              className={cn(
                "flex-1 py-2 items-center rounded-md",
                type === t && "bg-surface",
              )}
              onPress={() => setType(t)}
            >
              <Text
                className={cn(
                  "text-sm font-medium capitalize",
                  type === t
                    ? t === "income"
                      ? "text-income"
                      : "text-expense"
                    : "text-text-secondary",
                )}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="items-center py-6">
            <DonutChart slices={slices} size={200} strokeWidth={30}>
              <View className="items-center">
                <Text className="text-xs text-text-secondary capitalize">{type}</Text>
                <Text
                  className={cn(
                    "text-xl font-bold",
                    type === "income" ? "text-income" : "text-expense",
                  )}
                >
                  {formatCurrency(data.total)}
                </Text>
              </View>
            </DonutChart>
          </View>

          {rows.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-text-secondary text-base">No {type} this month</Text>
            </View>
          ) : (
            rows.map((row) => (
              <View key={row.categoryId ?? "none"} className="px-4 py-3 border-b border-border">
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: row.color }}
                  />
                  <Text className="text-base text-text flex-1" numberOfLines={1}>
                    {row.icon ? `${row.icon} ` : ""}
                    {row.name}
                  </Text>
                  <Text className="text-sm text-text-secondary mr-3">
                    {row.pct.toFixed(0)}%
                  </Text>
                  <Text className="text-base font-medium text-text">
                    {formatCurrency(row.total)}
                  </Text>
                </View>
                <View className="h-1.5 rounded-full bg-card overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
