import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import {
  breakdownBy,
  filterByType,
  type StatsTxn,
} from "../../services/stats-service";
import { DonutChart } from "../donut-chart";
import { ChartCard } from "./chart-card";
import { chartColor } from "../../lib/chart-colors";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

type Props = { txns: StatsTxn[] };

// Donut + ranked category list. Tapping a parent category drills into its
// subcategory breakdown. Has its own income/expense toggle (a donut needs a
// single type); the active period/account/other filters still apply.
export function CategoryBreakdownCard({ txns }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [drillRootId, setDrillRootId] = useState<number | null>(null);

  const typed = useMemo(() => filterByType(txns, type), [txns, type]);

  const drillParentName = useMemo(() => {
    if (drillRootId == null) return null;
    return typed.find((t) => t.rootId === drillRootId)?.rootName ?? "Category";
  }, [typed, drillRootId]);

  const { rows, total } = useMemo(() => {
    if (drillRootId == null) return breakdownBy(typed, "category");
    const inParent = typed.filter((t) => t.rootId === drillRootId);
    return breakdownBy(inParent, "subcategory");
  }, [typed, drillRootId]);

  const colored = useMemo(
    () => rows.map((r, i) => ({ ...r, fill: r.color ?? chartColor(i) })),
    [rows],
  );
  const slices = useMemo(
    () => colored.map((r) => ({ value: r.total, color: r.fill })),
    [colored],
  );

  return (
    <ChartCard
      title="Categories"
      subtitle={drillParentName ?? undefined}
      right={
        drillRootId == null ? (
          <View className="flex-row bg-surface rounded-lg p-0.5">
            {(["expense", "income"] as const).map((t) => (
              <Pressable
                key={t}
                className={cn(
                  "px-3 py-1 rounded-md",
                  type === t && (t === "income" ? "bg-income/20" : "bg-expense/20"),
                )}
                onPress={() => setType(t)}
              >
                <Text
                  className={cn(
                    "text-xs font-medium capitalize",
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
        ) : (
          <Pressable
            onPress={() => setDrillRootId(null)}
            className="flex-row items-center px-2 py-1"
          >
            <ChevronLeft size={16} color={c.primary} />
            <Text className="text-xs text-primary">Back</Text>
          </Pressable>
        )
      }
    >
      {colored.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No {type} in this range</Text>
        </View>
      ) : (
        <>
          <View className="items-center py-2">
            <DonutChart slices={slices} size={170} strokeWidth={26}>
              <View className="items-center">
                <Text className="text-[11px] text-text-secondary capitalize">{type}</Text>
                <Text
                  className={cn(
                    "text-lg font-bold",
                    type === "income" ? "text-income" : "text-expense",
                  )}
                >
                  {formatCurrency(total)}
                </Text>
              </View>
            </DonutChart>
          </View>

          <View className="mt-2">
            {colored.map((row) => {
              const canDrill = drillRootId == null && row.id != null;
              return (
                <Pressable
                  key={row.key}
                  disabled={!canDrill}
                  onPress={() => canDrill && setDrillRootId(row.id)}
                  className="py-2 active:opacity-60"
                >
                  <View className="flex-row items-center mb-1">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: row.fill }}
                    />
                    <Text className="text-sm text-text flex-1" numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text className="text-xs text-text-secondary mr-2">
                      {row.pct.toFixed(0)}%
                    </Text>
                    <Text className="text-sm font-medium text-text">
                      {formatCurrency(row.total)}
                    </Text>
                  </View>
                  <View className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, backgroundColor: row.fill }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ChartCard>
  );
}
