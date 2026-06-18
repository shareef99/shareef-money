import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { NetWorthPoint } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { points: NetWorthPoint[]; subtitle?: string };

// Cumulative net worth over the range (area line). Values are stored ×100.
export function NetWorthLineCard({ points, subtitle }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const screenWidth = Dimensions.get("window").width;

  const data = useMemo(
    () => points.map((p) => ({ value: p.value / 100, label: p.label })),
    [points],
  );
  const latest = points.length ? points[points.length - 1]!.value : 0;

  return (
    <ChartCard
      title="Net worth"
      subtitle={subtitle}
      right={<Text className="text-sm font-semibold text-text">{formatCurrency(latest)}</Text>}
    >
      {data.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No data in this range</Text>
        </View>
      ) : (
        <View className="-ml-2">
          <LineChart
            data={data}
            areaChart
            color={c.primary}
            startFillColor={c.primary}
            endFillColor={c.primary}
            startOpacity={0.25}
            endOpacity={0.02}
            thickness={2}
            isAnimated={false}
            height={160}
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
