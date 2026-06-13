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
type Period = "weekly" | "monthly" | "annually";

const PERIODS: { key: Period; label: string }[] = [
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "annually", label: "Year" },
];

// Monday-based start of the week containing d.
function startOfWeek(d: Date) {
  const r = new Date(d);
  const dow = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - dow);
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function StatsScreen() {
  const [type, setType] = useState<StatsType>("expense");
  const [period, setPeriod] = useState<Period>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (period === "weekly") {
      const start = startOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const fmt = (x: Date) =>
        x.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      return { rangeStart: start, rangeEnd: end, rangeLabel: `${fmt(start)} – ${fmt(end)}` };
    }
    if (period === "annually") {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end, rangeLabel: String(currentDate.getFullYear()) };
    }
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return {
      rangeStart: start,
      rangeEnd: end,
      rangeLabel: currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }, [period, currentDate]);

  const { data } = useCategoryBreakdown(type, rangeStart, rangeEnd);

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

  const navigate = (dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (period === "weekly") d.setDate(d.getDate() + dir * 7);
      else if (period === "annually") d.setFullYear(d.getFullYear() + dir);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row justify-center gap-2 px-4 pt-2">
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              className={cn(
                "px-4 py-1.5 rounded-full border",
                period === p.key ? "bg-primary border-primary" : "bg-card border-border",
              )}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                className={cn(
                  "text-sm",
                  period === p.key ? "text-primary-foreground" : "text-text-secondary",
                )}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={() => navigate(-1)} className="p-2">
            <ChevronLeft size={20} className="text-text" />
          </Pressable>
          <Text className="text-base font-semibold text-text">{rangeLabel}</Text>
          <Pressable onPress={() => navigate(1)} className="p-2">
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
