import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import type { TimePoint } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { points: TimePoint[]; subtitle?: string };

// Income vs expense as grouped bars per time bucket (gifted-charts). Values are
// shown in major currency units (amounts are stored ×100).
export function IncomeExpenseBarCard({ points, subtitle }: Props) {
  const scheme = useColorScheme().colorScheme;
  const c = getColors(scheme);
  const screenWidth = Dimensions.get("window").width;

  const { data, hasAny } = useMemo(() => {
    const out: {
      value: number;
      label?: string;
      frontColor: string;
      spacing?: number;
      labelWidth?: number;
    }[] = [];
    let any = false;
    for (const p of points) {
      if (p.income || p.expense) any = true;
      out.push({
        value: p.income / 100,
        label: p.label,
        frontColor: c.income,
        spacing: 2,
        labelWidth: 36,
      });
      out.push({ value: p.expense / 100, frontColor: c.expense });
    }
    return { data: out, hasAny: any };
  }, [points, c.income, c.expense]);

  return (
    <ChartCard title="Income vs Expense" subtitle={subtitle} right={<Legend c={c} />}>
      {!hasAny ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No data in this range</Text>
        </View>
      ) : (
        <View className="-ml-2">
          <BarChart
            data={data}
            barWidth={9}
            spacing={16}
            initialSpacing={10}
            roundedTop
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
            width={screenWidth - 80}
          />
        </View>
      )}
    </ChartCard>
  );
}

function Legend({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <View className="flex-row gap-3">
      <Dot color={c.income} label="In" />
      <Dot color={c.expense} label="Out" />
    </View>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: color }} />
      <Text className="text-xs text-text-secondary">{label}</Text>
    </View>
  );
}
