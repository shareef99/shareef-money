import { useMemo } from "react";
import { Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { BreakdownRow } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { chartColor } from "../../lib/chart-colors";

type Props = {
  title: string;
  subtitle?: string;
  rows: BreakdownRow[];
  emptyText?: string;
  limit?: number;
};

// A ranked horizontal-bar list (used for locations, people, day-of-week, etc.).
export function RankedBarCard({ title, subtitle, rows, emptyText, limit = 8 }: Props) {
  const shown = useMemo(
    () =>
      rows.slice(0, limit).map((r, i) => ({ ...r, fill: r.color ?? chartColor(i) })),
    [rows, limit],
  );

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {shown.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">{emptyText ?? "No data in this range"}</Text>
        </View>
      ) : (
        shown.map((row) => (
          <View key={row.key} className="py-2">
            <View className="flex-row items-center mb-1">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: row.fill }} />
              <Text className="text-sm text-text flex-1" numberOfLines={1}>
                {row.name}
              </Text>
              <Text className="text-xs text-text-secondary mr-2">{row.pct.toFixed(0)}%</Text>
              <Text className="text-sm font-medium text-text">{formatCurrency(row.total)}</Text>
            </View>
            <View className="h-1.5 rounded-full bg-surface overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${row.pct}%`, backgroundColor: row.fill }}
              />
            </View>
          </View>
        ))
      )}
    </ChartCard>
  );
}
