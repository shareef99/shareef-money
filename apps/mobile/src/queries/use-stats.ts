import { useCallback } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import * as statsService from "../services/stats-service";
import {
  serializeFilter,
  navigatePeriod,
  type StatsFilter,
  type RangeOpts,
} from "../lib/stats-filter";
import type { TimeBucket } from "../services/stats-service";

export const statsKeys = {
  all: ["stats"] as const,
  txns: (userId: string | undefined, key: string) =>
    [...statsKeys.all, "txns", userId, key] as const,
  cashflow: (userId: string | undefined, from: number, to: number) =>
    [...statsKeys.all, "cashflow", userId, from, to] as const,
  netWorth: (userId: string | undefined, from: number, to: number, bucket: string) =>
    [...statsKeys.all, "networth", userId, from, to, bucket] as const,
};

// One synchronous filtered read per filter. keepPreviousData keeps the current
// charts on screen while the next period loads; with prefetch (below) adjacent
// periods are already cached so swiping is instant. Any transaction mutation
// invalidates ["transactions"]; we also invalidate ["stats"] there.
export function useStatsTransactions(filter: StatsFilter) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: statsKeys.txns(user?.id, serializeFilter(filter)),
    queryFn: () => statsService.queryStatsTransactions(db, user!.id, filter),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// Whole-portfolio cash flow for the filter's range (for the waterfall).
export function useCashFlow(filter: StatsFilter) {
  const { db } = useDatabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: statsKeys.cashflow(user?.id, filter.from.getTime(), filter.to.getTime()),
    queryFn: () => statsService.cashFlow(db, user!.id, filter.from, filter.to),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// Cumulative net worth per bucket across the range (for the net-worth line).
export function useNetWorthSeries(
  filter: StatsFilter,
  bucket: TimeBucket,
  weekStartMonday: boolean,
) {
  const { db } = useDatabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: statsKeys.netWorth(user?.id, filter.from.getTime(), filter.to.getTime(), bucket),
    queryFn: () =>
      statsService.netWorthSeries(db, user!.id, filter.from, filter.to, bucket, weekStartMonday),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// Warm the previous and next period so swiping onto either is instant.
export function usePrefetchStatsPeriod() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    (filter: StatsFilter, opts: RangeOpts) => {
      if (!user || filter.period === "custom") return;
      const weekStartMonday = opts.weekStart === "monday";
      for (const dir of [-1, 1] as const) {
        const f = navigatePeriod(filter, dir, opts);
        // Warm all three reads a navigation triggers, so swiping/arrowing onto
        // an adjacent period is a pure cache hit (no synchronous query on the
        // critical path).
        queryClient.prefetchQuery({
          queryKey: statsKeys.txns(user.id, serializeFilter(f)),
          queryFn: () => statsService.queryStatsTransactions(db, user.id, f),
          staleTime: 60_000,
        });
        queryClient.prefetchQuery({
          queryKey: statsKeys.cashflow(user.id, f.from.getTime(), f.to.getTime()),
          queryFn: () => statsService.cashFlow(db, user.id, f.from, f.to),
          staleTime: 60_000,
        });
        const b = statsService.autoBucket(f.from, f.to);
        queryClient.prefetchQuery({
          queryKey: statsKeys.netWorth(user.id, f.from.getTime(), f.to.getTime(), b),
          queryFn: () =>
            statsService.netWorthSeries(db, user.id, f.from, f.to, b, weekStartMonday),
          staleTime: 60_000,
        });
      }
    },
    [db, user, queryClient],
  );
}
