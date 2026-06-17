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

export const statsKeys = {
  all: ["stats"] as const,
  txns: (userId: string | undefined, key: string) =>
    [...statsKeys.all, "txns", userId, key] as const,
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

// Warm the previous and next period so swiping onto either is instant.
export function usePrefetchStatsPeriod() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    (filter: StatsFilter, opts: RangeOpts) => {
      if (!user || filter.period === "custom") return;
      for (const dir of [-1, 1] as const) {
        const f = navigatePeriod(filter, dir, opts);
        queryClient.prefetchQuery({
          queryKey: statsKeys.txns(user.id, serializeFilter(f)),
          queryFn: () => statsService.queryStatsTransactions(db, user.id, f),
          staleTime: 60_000,
        });
      }
    },
    [db, user, queryClient],
  );
}
