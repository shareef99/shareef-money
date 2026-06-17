import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { Category } from "@shareef-money/db/schema";
import { useCategories } from "../../../queries/use-categories";
import { useCategoryBreakdown } from "../../../queries/use-transactions";
import { useBudgets, useSetBudget, effectiveBudget } from "../../../queries/use-budgets";
import { useSettings } from "../../../queries/use-settings";
import { getMonthRange, monthRangeLabel } from "../../../lib/period";
import { AmountInputModal } from "../../../components/amount-input-modal";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

type BudgetType = "expense" | "income";

function ProgressBar({ ratio, type }: { ratio: number; type: BudgetType }) {
  const pct = Math.min(100, ratio * 100);
  const over = ratio > 1;
  // For expenses, going over budget is bad (red); for income, exceeding the
  // target is good, so keep it positive.
  const color = type === "expense" && over ? "bg-expense" : "bg-primary";
  return (
    <View className="h-2 rounded-full bg-card-alt overflow-hidden">
      <View className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [type, setType] = useState<BudgetType>("expense");
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const { data: settings } = useSettings();

  const { monthStart, monthEnd } = useMemo(() => {
    const { start, end } = getMonthRange(currentDate, settings.monthStartDay);
    return { monthStart: start, monthEnd: end };
  }, [currentDate, settings.monthStartDay]);

  const monthKey = useMemo(
    () => `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
    [monthStart],
  );

  const { data: categories = [] } = useCategories(type);
  const { data: breakdown = { rows: [], total: 0 } } = useCategoryBreakdown(
    type,
    monthStart,
    monthEnd,
  );
  const { data: budgets } = useBudgets();
  const setBudget = useSetBudget();

  const parents = useMemo(() => categories.filter((cat) => !cat.parentId), [categories]);

  // Attribute each category's amount (incl. subcategories) to its top-level parent.
  const actualByParent = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of breakdown.rows) {
      if (row.categoryId == null) continue;
      const cat = categories.find((x) => x.id === row.categoryId);
      const topId = cat?.parentId ?? row.categoryId;
      map.set(topId, (map.get(topId) ?? 0) + row.total);
    }
    return map;
  }, [breakdown, categories]);

  const totalBudget = parents.reduce((s, p) => s + effectiveBudget(budgets, monthKey, p.id), 0);
  const totalActual = parents.reduce((s, p) => s + (actualByParent.get(p.id) ?? 0), 0);

  const monthLabel = monthRangeLabel(currentDate, settings.monthStartDay);
  const actualWord = type === "expense" ? "spent" : "earned";

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2">Budget</Text>
        </View>

        <View className="flex-row mx-4 mt-1 mb-2 bg-card rounded-lg p-1">
          {(["expense", "income"] as const).map((t) => (
            <Pressable
              key={t}
              className={cn("flex-1 py-2 items-center rounded-md", type === t && "bg-surface")}
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

        <View className="flex-row items-center justify-center px-4 py-1">
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={18} color={c.text} />
          </Pressable>
          <Text className="text-sm font-medium text-text mx-3">{monthLabel}</Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
            <ChevronRight size={18} color={c.text} />
          </Pressable>
        </View>

        <View className="mx-4 my-2 bg-card rounded-xl p-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-text-secondary">Total budget</Text>
            <Text className="text-sm text-text-secondary">
              {totalBudget > 0 ? formatCurrency(totalBudget) : "Not set"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-text mb-2">
            {formatCurrency(totalActual)}{" "}
            <Text className="text-sm text-text-secondary">{actualWord}</Text>
          </Text>
          {totalBudget > 0 && (
            <>
              <ProgressBar ratio={totalActual / totalBudget} type={type} />
              <Text
                className={cn(
                  "text-xs mt-1",
                  type === "expense" && totalActual > totalBudget
                    ? "text-expense"
                    : "text-text-secondary",
                )}
              >
                {totalActual > totalBudget
                  ? type === "expense"
                    ? `${formatCurrency(totalActual - totalBudget)} over budget`
                    : `${formatCurrency(totalActual - totalBudget)} over target`
                  : `${formatCurrency(totalBudget - totalActual)} ${type === "expense" ? "remaining" : "to go"}`}
              </Text>
            </>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {parents.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-text-secondary">No {type} categories</Text>
            </View>
          ) : (
            parents.map((cat) => {
              const budget = effectiveBudget(budgets, monthKey, cat.id);
              const isOverride = budgets.months[monthKey]?.[String(cat.id)] !== undefined;
              const actual = actualByParent.get(cat.id) ?? 0;
              return (
                <Pressable
                  key={cat.id}
                  className="px-4 py-3 border-b border-border active:bg-card"
                  onPress={() => setEditTarget(cat)}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base text-text flex-1" numberOfLines={1}>
                      {cat.name}
                      {isOverride ? (
                        <Text className="text-xs text-text-muted"> · this month</Text>
                      ) : null}
                    </Text>
                    <Text className="text-sm text-text-secondary">
                      {formatCurrency(actual)}
                      {budget > 0 ? ` / ${formatCurrency(budget)}` : ""}
                    </Text>
                  </View>
                  {budget > 0 ? (
                    <ProgressBar ratio={actual / budget} type={type} />
                  ) : (
                    <Text className="text-xs text-text-muted">Tap to set a budget</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <AmountInputModal
          visible={editTarget !== null}
          title={editTarget ? `Budget for ${editTarget.name}` : "Budget"}
          monthLabel={monthLabel}
          initialAmount={editTarget ? effectiveBudget(budgets, monthKey, editTarget.id) : 0}
          onClose={() => setEditTarget(null)}
          onSubmit={(amount, applyToAll) => {
            if (editTarget)
              setBudget.mutate({ monthKey, categoryId: editTarget.id, amount, applyToAll });
            setEditTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
