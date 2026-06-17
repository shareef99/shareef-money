import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useStatsFilter } from "./stats-filter-context";
import {
  useStatsTransactions,
  useCashFlow,
  useNetWorthSeries,
} from "../../queries/use-stats";
import { useContacts } from "../../queries/use-contacts";
import { useCategories } from "../../queries/use-categories";
import { useBudgets, effectiveBudget } from "../../queries/use-budgets";
import {
  autoBucket,
  summarize,
  timeSeries,
  transferMatrix,
  breakdownBy,
  filterByType,
  dailyTotals,
  stackedByCategory,
} from "../../services/stats-service";
import { navigatePeriod } from "../../lib/stats-filter";
import { StatsFilterBar } from "./stats-filter-bar";
import { SummaryCards } from "./summary-cards";
import { PeriodComparisonCard } from "./period-comparison-card";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { IncomeExpenseBarCard } from "./income-expense-bar-card";
import { NetLineCard } from "./net-line-card";
import { StackedBarCard } from "./stacked-bar-card";
import { SankeyCard } from "./sankey-card";
import { TransferFlowCard } from "./transfer-flow-card";
import { CashFlowWaterfallCard } from "./cash-flow-waterfall-card";
import { NetWorthLineCard } from "./net-worth-line-card";
import { TreemapCard } from "./treemap-card";
import { CalendarHeatmapCard } from "./calendar-heatmap-card";
import { DayOfWeekCard } from "./day-of-week-card";
import { RankedBarCard } from "./ranked-bar-card";
import { BudgetActualCard } from "./budget-actual-card";

export function StatsDashboard() {
  const { filter, setFilter, rangeOpts } = useStatsFilter();
  const { data: txns = [] } = useStatsTransactions(filter);
  const { data: contacts = [] } = useContacts();
  const { data: categories = [] } = useCategories();
  const { data: budgets } = useBudgets();

  const weekStartMonday = rangeOpts.weekStart === "monday";
  const bucket = useMemo(() => autoBucket(filter.from, filter.to), [filter.from, filter.to]);
  const bucketLabel = bucket === "day" ? "by day" : bucket === "week" ? "by week" : "by month";

  const summary = useMemo(() => summarize(txns), [txns]);
  const transfers = useMemo(() => transferMatrix(txns), [txns]);
  const points = useMemo(
    () => timeSeries(txns, filter.from, filter.to, bucket, weekStartMonday),
    [txns, filter.from, filter.to, bucket, weekStartMonday],
  );
  const { data: cashflow } = useCashFlow(filter);
  const { data: netWorth = [] } = useNetWorthSeries(filter, bucket, weekStartMonday);

  // Previous period (for the comparison card). Prefetched, so cached.
  const prevFilter = useMemo(
    () => (filter.period === "custom" ? null : navigatePeriod(filter, -1, rangeOpts)),
    [filter, rangeOpts],
  );
  const { data: prevTxns = [] } = useStatsTransactions(prevFilter ?? filter);
  const prevSummary = useMemo(() => summarize(prevTxns), [prevTxns]);

  const contactNames = useMemo(
    () => new Map(contacts.map((c) => [c.id, c.name])),
    [contacts],
  );
  const expenseTxns = useMemo(() => filterByType(txns, "expense"), [txns]);
  const treeRows = useMemo(() => breakdownBy(expenseTxns, "category").rows, [expenseTxns]);
  const locationRows = useMemo(() => breakdownBy(expenseTxns, "location").rows, [expenseTxns]);
  const peopleRows = useMemo(
    () => breakdownBy(expenseTxns, "person", contactNames).rows,
    [expenseTxns, contactNames],
  );
  const dowRows = useMemo(() => breakdownBy(expenseTxns, "dayOfWeek").rows, [expenseTxns]);
  const dailyExpense = useMemo(() => dailyTotals(txns, "expense"), [txns]);
  const stacked = useMemo(
    () => stackedByCategory(txns, filter.from, filter.to, bucket, weekStartMonday),
    [txns, filter.from, filter.to, bucket, weekStartMonday],
  );

  const monthKey = `${filter.anchor.getFullYear()}-${String(filter.anchor.getMonth() + 1).padStart(2, "0")}`;
  const budgetItems = useMemo(() => {
    if (filter.period !== "month") return [];
    const actualByCat = new Map(treeRows.map((r) => [r.id, r.total]));
    const catMeta = new Map(categories.map((c) => [c.id, c]));
    const ids = new Set<number>();
    for (const k of Object.keys(budgets.default)) ids.add(Number(k));
    for (const k of Object.keys(budgets.months[monthKey] ?? {})) ids.add(Number(k));
    const items = [];
    for (const id of ids) {
      const budget = effectiveBudget(budgets, monthKey, id);
      if (budget <= 0) continue;
      const meta = catMeta.get(id);
      items.push({
        id,
        name: meta?.name ?? "Category",
        color: meta?.color ?? null,
        budget,
        actual: actualByCat.get(id) ?? 0,
      });
    }
    return items.sort((a, b) => b.actual - a.actual);
  }, [filter.period, treeRows, categories, budgets, monthKey]);

  const swipe = useMemo(
    () =>
      Gesture.Race(
        Gesture.Fling()
          .direction(Directions.LEFT)
          .onEnd(() => runOnJS(setFilter)((f) => navigatePeriod(f, 1, rangeOpts))),
        Gesture.Fling()
          .direction(Directions.RIGHT)
          .onEnd(() => runOnJS(setFilter)((f) => navigatePeriod(f, -1, rangeOpts))),
      ),
    [setFilter, rangeOpts],
  );

  return (
    <View className="flex-1">
      <StatsFilterBar />
      <GestureDetector gesture={swipe}>
        <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}>
          <SummaryCards summary={summary} />
          {prevFilter ? (
            <PeriodComparisonCard current={summary} previous={prevSummary} />
          ) : null}
          <CategoryBreakdownCard txns={txns} />
          <IncomeExpenseBarCard points={points} subtitle={bucketLabel} />
          <NetLineCard points={points} subtitle={bucketLabel} />
          <StackedBarCard labels={stacked.labels} series={stacked.series} subtitle={`top categories ${bucketLabel}`} />
          <TreemapCard rows={treeRows} subtitle="expenses by category" />
          <CalendarHeatmapCard
            daily={dailyExpense}
            from={filter.from}
            to={filter.to}
            weekStartMonday={weekStartMonday}
          />
          <DayOfWeekCard rows={dowRows} weekStartMonday={weekStartMonday} />
          <SankeyCard txns={txns} />
          {cashflow ? <CashFlowWaterfallCard flow={cashflow} /> : null}
          <NetWorthLineCard points={netWorth} subtitle={bucketLabel} />
          <TransferFlowCard edges={transfers} />
          <RankedBarCard
            title="Top locations"
            subtitle="expenses by place"
            rows={locationRows}
            emptyText="No locations tagged"
          />
          <RankedBarCard
            title="Top people"
            subtitle="expenses by person"
            rows={peopleRows}
            emptyText="No people tagged"
          />
          {filter.period === "month" ? <BudgetActualCard items={budgetItems} /> : null}
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
