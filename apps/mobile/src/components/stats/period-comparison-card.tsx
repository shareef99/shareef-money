import { Text, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { StatsSummary } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

type Props = { current: StatsSummary; previous: StatsSummary };

// Current vs previous period for income / expense / net, with % delta.
export function PeriodComparisonCard({ current, previous }: Props) {
  const c = getColors(useColorScheme().colorScheme);

  const rows = [
    { label: "Income", now: current.income, was: previous.income, goodUp: true },
    { label: "Expense", now: current.expense, was: previous.expense, goodUp: false },
    { label: "Net", now: current.net, was: previous.net, goodUp: true },
  ];

  return (
    <ChartCard title="vs last period" subtitle="change from the previous period">
      {rows.map((r) => {
        const diff = r.now - r.was;
        const pct = r.was !== 0 ? (diff / Math.abs(r.was)) * 100 : 0;
        const flat = Math.abs(diff) < 1;
        const good = flat ? null : r.goodUp ? diff > 0 : diff < 0;
        const color = good == null ? c.textMuted : good ? c.income : c.expense;
        const Icon = flat ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight;
        return (
          <View key={r.label} className="flex-row items-center py-2.5 border-b border-border">
            <Text className="text-sm text-text-secondary w-20">{r.label}</Text>
            <Text className="text-base font-semibold text-text flex-1">
              {r.now < 0 ? "-" : ""}
              {formatCurrency(Math.abs(r.now))}
            </Text>
            <View className="flex-row items-center">
              <Icon size={14} color={color} />
              <Text className={cn("text-xs ml-0.5")} style={{ color }}>
                {flat ? "—" : `${Math.abs(pct).toFixed(0)}%`}
              </Text>
            </View>
          </View>
        );
      })}
    </ChartCard>
  );
}
