import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import type { TimePoint } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { points: TimePoint[]; subtitle?: string };

// Net (income − expense) per bucket as a line. Handles negative buckets.
export function NetLineCard({ points, subtitle }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const screenWidth = Dimensions.get("window").width;

  const { data, hasAny } = useMemo(() => {
    const out = points.map((p) => ({ value: p.net / 100, label: p.label }));
    return { data: out, hasAny: points.some((p) => p.income || p.expense) };
  }, [points]);

  return (
    <ChartCard title="Net flow" subtitle={subtitle}>
      {!hasAny ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No data in this range</Text>
        </View>
      ) : (
        <View className="-ml-2">
          <LineChart
            data={data}
            color={c.primary}
            thickness={2}
            isAnimated={false}
            height={150}
            noOfSections={3}
            hideDataPoints={data.length > 20}
            dataPointsColor={c.primary}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={c.border}
            rulesColor={c.border}
            rulesType="dashed"
            yAxisTextStyle={{ color: c.textMuted, fontSize: 9 }}
            xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 9 }}
            width={screenWidth - 90}
            spacing={Math.max(12, Math.min(48, (screenWidth - 110) / Math.max(1, data.length)))}
            initialSpacing={10}
          />
        </View>
      )}
    </ChartCard>
  );
}
