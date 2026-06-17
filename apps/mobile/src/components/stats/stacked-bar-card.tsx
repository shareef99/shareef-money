import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import type { StackSeries } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { chartColor } from "../../lib/chart-colors";
import { getColors } from "../../lib/colors";

type Props = { labels: string[]; series: StackSeries[]; subtitle?: string };

// Top categories stacked per time bucket (gifted-charts stackData).
export function StackedBarCard({ labels, series, subtitle }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const screenWidth = Dimensions.get("window").width;

  const colored = useMemo(
    () => series.map((s, i) => ({ ...s, fill: s.color ?? chartColor(i) })),
    [series],
  );

  const { stackData, hasAny } = useMemo(() => {
    let any = false;
    const out = labels.map((label, j) => {
      const stacks = colored
        .map((s) => ({ value: (s.values[j] ?? 0) / 100, color: s.fill }))
        .filter((st) => st.value > 0);
      if (stacks.length) any = true;
      return { label, stacks: stacks.length ? stacks : [{ value: 0, color: c.border }] };
    });
    return { stackData: out, hasAny: any };
  }, [labels, colored, c.border]);

  return (
    <ChartCard
      title="Spending mix"
      subtitle={subtitle}
      right={
        <View className="flex-row flex-wrap gap-x-2 gap-y-1 justify-end" style={{ maxWidth: 150 }}>
          {colored.map((s) => (
            <View key={s.name} className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: s.fill }} />
              <Text className="text-[10px] text-text-secondary" numberOfLines={1}>
                {s.name}
              </Text>
            </View>
          ))}
        </View>
      }
    >
      {!hasAny ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No data in this range</Text>
        </View>
      ) : (
        <View className="-ml-2">
          <BarChart
            stackData={stackData}
            barWidth={Math.max(8, Math.min(24, (screenWidth - 120) / Math.max(1, stackData.length) - 6))}
            spacing={6}
            initialSpacing={10}
            isAnimated={false}
            height={170}
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
