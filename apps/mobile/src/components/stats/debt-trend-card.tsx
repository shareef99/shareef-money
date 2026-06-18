import { useMemo, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { DebtTrendPoint } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

type Props = { points: DebtTrendPoint[]; subtitle?: string };

type View_ = "both" | "receivable" | "payable";

const TABS: { key: View_; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "receivable", label: "Owed to you" },
  { key: "payable", label: "You owe" },
];

// How receivable (owed to you) vs payable (you owe) moved over the range.
// Both lines are running snapshots, so the last point is today's position.
export function DebtTrendCard({ points, subtitle }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const screenWidth = Dimensions.get("window").width;
  const [view, setView] = useState<View_>("both");

  const hasAny = useMemo(
    () => points.some((p) => p.receivable || p.payable),
    [points],
  );

  const receivable = useMemo(
    () => points.map((p) => ({ value: p.receivable / 100, label: p.label })),
    [points],
  );
  const payable = useMemo(
    () => points.map((p) => ({ value: p.payable / 100, label: p.label })),
    [points],
  );

  if (!hasAny) return null;

  const last = points[points.length - 1];
  const showReceivable = view === "both" || view === "receivable";
  const showPayable = view === "both" || view === "payable";

  // gifted-charts wants `data` to be the primary series; pick whichever line is
  // visible first so a single-line view still renders.
  const primary = showReceivable ? receivable : payable;
  const primaryColor = showReceivable ? c.income : c.expense;
  const secondary = view === "both" ? payable : undefined;

  return (
    <ChartCard
      title="Debt trend"
      subtitle={subtitle}
      right={
        last ? (
          <Text
            className={cn(
              "text-sm font-semibold",
              last.net >= 0 ? "text-income" : "text-expense",
            )}
          >
            {last.net < 0 ? "-" : ""}
            {formatCurrency(Math.abs(last.net))}
          </Text>
        ) : null
      }
    >
      <View className="flex-row gap-2 mb-3">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setView(t.key)}
            className={cn(
              "px-3 py-1 rounded-full border",
              view === t.key ? "bg-primary border-primary" : "bg-card border-border",
            )}
          >
            <Text
              className={cn(
                "text-xs",
                view === t.key ? "text-primary-foreground" : "text-text-secondary",
              )}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row gap-4 mb-1">
        {showReceivable ? (
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.income }} />
            <Text className="text-xs text-text-secondary">
              Owed to you {last ? formatCurrency(last.receivable) : ""}
            </Text>
          </View>
        ) : null}
        {showPayable ? (
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.expense }} />
            <Text className="text-xs text-text-secondary">
              You owe {last ? formatCurrency(last.payable) : ""}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="-ml-2">
        <LineChart
          data={primary}
          color={primaryColor}
          {...(secondary
            ? { data2: secondary, color2: c.expense, thickness2: 2 }
            : {})}
          thickness={2}
          isAnimated={false}
          height={160}
          noOfSections={3}
          hideDataPoints={primary.length > 20}
          dataPointsColor={primaryColor}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={c.border}
          rulesColor={c.border}
          rulesType="dashed"
          yAxisTextStyle={{ color: c.textMuted, fontSize: 9 }}
          xAxisLabelTextStyle={{ color: c.textMuted, fontSize: 9 }}
          width={screenWidth - 90}
          spacing={Math.max(12, Math.min(48, (screenWidth - 110) / Math.max(1, primary.length)))}
          initialSpacing={10}
        />
      </View>
    </ChartCard>
  );
}
