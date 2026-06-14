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
import { useBudgets, useSetBudget } from "../../../queries/use-budgets";
import { AmountInputModal } from "../../../components/amount-input-modal";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.min(100, ratio * 100);
  const over = ratio > 1;
  return (
    <View className="h-2 rounded-full bg-card-alt overflow-hidden">
      <View
        className={cn("h-full rounded-full", over ? "bg-expense" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const monthStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);
  const monthEnd = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

  const { data: categories = [] } = useCategories("expense");
  const { data: breakdown } = useCategoryBreakdown("expense", monthStart, monthEnd);
  const { data: budgets } = useBudgets();
  const setBudget = useSetBudget();

  const parents = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  // Attribute each category's spend (incl. subcategories) to its top-level parent.
  const spentByParent = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of breakdown.rows) {
      if (row.categoryId == null) continue;
      const cat = categories.find((c) => c.id === row.categoryId);
      const topId = cat?.parentId ?? row.categoryId;
      map.set(topId, (map.get(topId) ?? 0) + row.total);
    }
    return map;
  }, [breakdown, categories]);

  const totalBudget = parents.reduce((s, p) => s + (budgets[String(p.id)] ?? 0), 0);
  const totalSpent = parents.reduce((s, p) => s + (spentByParent.get(p.id) ?? 0), 0);

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
            {formatCurrency(totalSpent)}{" "}
            <Text className="text-sm text-text-secondary">spent</Text>
          </Text>
          {totalBudget > 0 && (
            <>
              <ProgressBar ratio={totalSpent / totalBudget} />
              <Text
                className={cn(
                  "text-xs mt-1",
                  totalSpent > totalBudget ? "text-expense" : "text-text-secondary",
                )}
              >
                {totalSpent > totalBudget
                  ? `${formatCurrency(totalSpent - totalBudget)} over budget`
                  : `${formatCurrency(totalBudget - totalSpent)} remaining`}
              </Text>
            </>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {parents.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-text-secondary">No expense categories</Text>
            </View>
          ) : (
            parents.map((cat) => {
              const budget = budgets[String(cat.id)] ?? 0;
              const spent = spentByParent.get(cat.id) ?? 0;
              return (
                <Pressable
                  key={cat.id}
                  className="px-4 py-3 border-b border-border active:bg-card"
                  onPress={() => setEditTarget(cat)}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base text-text flex-1" numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Text className="text-sm text-text-secondary">
                      {formatCurrency(spent)}
                      {budget > 0 ? ` / ${formatCurrency(budget)}` : ""}
                    </Text>
                  </View>
                  {budget > 0 ? (
                    <ProgressBar ratio={spent / budget} />
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
          initialAmount={editTarget ? budgets[String(editTarget.id)] ?? 0 : 0}
          onClose={() => setEditTarget(null)}
          onSubmit={(amount) => {
            if (editTarget) setBudget.mutate({ categoryId: editTarget.id, amount });
            setEditTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
