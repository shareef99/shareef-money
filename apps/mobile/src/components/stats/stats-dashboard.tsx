import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useStatsFilter } from "./stats-filter-context";
import { useStatsTransactions } from "../../queries/use-stats";
import {
  autoBucket,
  summarize,
  timeSeries,
} from "../../services/stats-service";
import { navigatePeriod } from "../../lib/stats-filter";
import { StatsFilterBar } from "./stats-filter-bar";
import { SummaryCards } from "./summary-cards";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { IncomeExpenseBarCard } from "./income-expense-bar-card";
import { NetLineCard } from "./net-line-card";

export function StatsDashboard() {
  const { filter, setFilter, rangeOpts } = useStatsFilter();
  const { data: txns = [] } = useStatsTransactions(filter);

  const summary = useMemo(() => summarize(txns), [txns]);

  const bucket = useMemo(() => autoBucket(filter.from, filter.to), [filter.from, filter.to]);
  const points = useMemo(
    () => timeSeries(txns, filter.from, filter.to, bucket, rangeOpts.weekStart === "monday"),
    [txns, filter.from, filter.to, bucket, rangeOpts.weekStart],
  );
  const bucketLabel = bucket === "day" ? "by day" : bucket === "week" ? "by week" : "by month";

  // Swipe: left = next period, right = previous (disabled for custom ranges).
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
        <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
          <SummaryCards summary={summary} />
          <CategoryBreakdownCard txns={txns} />
          <IncomeExpenseBarCard points={points} subtitle={bucketLabel} />
          <NetLineCard points={points} subtitle={bucketLabel} />
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
