import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import type { BreakdownRow } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { rows: BreakdownRow[]; weekStartMonday: boolean };

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Average/total spend by weekday — surfaces which days you spend most.
export function DayOfWeekCard({ rows, weekStartMonday }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const screenWidth = Dimensions.get("window").width;

  const { data, hasAny } = useMemo(() => {
    const byDay = new Map<number, number>();
    for (const r of rows) if (r.id != null) byDay.set(r.id, r.total);
    const order = weekStartMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
    const out = order.map((d) => ({
      value: (byDay.get(d) ?? 0) / 100,
      label: SHORT[d]!,
      frontColor: c.expense,
    }));
    return { data: out, hasAny: out.some((o) => o.value > 0) };
  }, [rows, weekStartMonday, c.expense]);

  return (
    <ChartCard title="Spend by weekday" subtitle="expenses">
      {!hasAny ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No expenses in this range</Text>
        </View>
      ) : (
        <View className="-ml-2">
          <BarChart
            data={data}
            barWidth={20}
            spacing={(screenWidth - 120) / 7 - 20}
            initialSpacing={12}
            roundedTop
            isAnimated={false}
            height={150}
            noOfSections={3}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={c.border}
            rulesColor={c.border}
            rulesType="dashed"
            yAxisTextStyle={{ color: c.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 9 }}
            width={screenWidth - 90}
          />
        </View>
      )}
    </ChartCard>
  );
}
