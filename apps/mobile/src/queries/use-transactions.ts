import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ALL_TIME_FROM } from "@shareef-money/shared/constants";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as transactionService from "../services/transaction-service";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: Record<string, unknown>) => [...transactionKeys.all, "list", filters] as const,
  summary: (from: string, to: string) => [...transactionKeys.all, "summary", from, to] as const,
  monthlySummary: (year: number) => [...transactionKeys.all, "monthly-summary", year] as const,
  account: (accountId?: number) => [...transactionKeys.all, "account", accountId] as const,
  breakdown: (type: string, from: string, to: string) =>
    [...transactionKeys.all, "breakdown", type, from, to] as const,
};

// Reads hit local SQLite (synchronous under expo-sqlite), so a recently-read
// range stays fresh briefly to make back-and-forth month swiping instant. Any
// mutation still invalidates transactionKeys.all, so edits show up immediately.
const READ_STALE_TIME = 60_000;

export function useTransactions(filters: {
  dateFrom?: Date;
  dateTo?: Date;
  type?: "income" | "expense" | "transfer";
  limit?: number;
}) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.list({
      userId: user?.id,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString(),
      type: filters.type,
      limit: filters.limit,
    }),
    queryFn: () => transactionService.getTransactions(db, user!.id, filters),
    enabled: !!user,
    // Keep the previous month's rows on screen while the next month loads, so
    // swiping never flashes an empty list.
    placeholderData: keepPreviousData,
    staleTime: READ_STALE_TIME,
  });
}

// Warm the cache for a month's transactions + summary so swiping onto it is
// instant. Call for the adjacent months whenever the visible month changes.
export function usePrefetchTransactionsMonth() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    (from: Date, to: Date) => {
      if (!user) return;
      queryClient.prefetchQuery({
        queryKey: transactionKeys.list({
          userId: user.id,
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
          type: undefined,
        }),
        queryFn: () =>
          transactionService.getTransactions(db, user.id, {
            dateFrom: from,
            dateTo: to,
          }),
        staleTime: READ_STALE_TIME,
      });
      queryClient.prefetchQuery({
        queryKey: transactionKeys.summary(from.toISOString(), to.toISOString()),
        queryFn: () =>
          transactionService.getTransactionsSummary(db, user.id, from, to),
        staleTime: READ_STALE_TIME,
      });
      // Carry-forward (everything before this month) — also a per-month key,
      // so warm it too or the brought-forward line lags on each navigation.
      const priorEnd = new Date(from.getTime() - 1);
      queryClient.prefetchQuery({
        queryKey: transactionKeys.summary(
          ALL_TIME_FROM.toISOString(),
          priorEnd.toISOString(),
        ),
        queryFn: () =>
          transactionService.getTransactionsSummary(db, user.id, ALL_TIME_FROM, priorEnd),
        staleTime: READ_STALE_TIME,
      });
    },
    [db, user, queryClient],
  );
}

export function useCategoryBreakdown(
  type: "income" | "expense",
  from: Date,
  to: Date,
) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.breakdown(type, from.toISOString(), to.toISOString()),
    queryFn: () => transactionService.getCategoryBreakdown(db, user!.id, type, from, to),
    enabled: !!user,
    initialData: { rows: [], total: 0 },
    staleTime: READ_STALE_TIME,
  });
}

export function useTransactionsSummary(from: Date, to: Date) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.summary(from.toISOString(), to.toISOString()),
    queryFn: () => transactionService.getTransactionsSummary(db, user!.id, from, to),
    enabled: !!user,
    // No initialData here: it would re-seed every new month key with zeros and
    // defeat keepPreviousData. Call sites default the (briefly) undefined value.
    placeholderData: keepPreviousData,
    staleTime: READ_STALE_TIME,
  });
}

// All transactions for one account (source or transfer target), uncapped.
export function useAccountTransactions(accountId: number | null) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.account(accountId ?? undefined),
    queryFn: () => transactionService.getAccountTransactions(db, user!.id, accountId!),
    enabled: !!user && accountId != null,
    // No initialData: paired with staleTime it would be treated as fresh and
    // the query would never run. The call site defaults the value to [].
    placeholderData: keepPreviousData,
    staleTime: READ_STALE_TIME,
  });
}

// One query for the whole year's per-month income/expense totals (drives the
// Monthly tab). Replaces 12 separate summary queries.
export function useMonthlySummary(year: number) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.monthlySummary(year),
    queryFn: () => transactionService.getMonthlySummary(db, user!.id, year),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: READ_STALE_TIME,
  });
}

export function useCreateTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof transactionService.createTransaction>[2]) =>
      transactionService.createTransaction(db, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      triggerSync();
    },
  });
}

export function useUpdateTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: Parameters<typeof transactionService.updateTransaction>[3];
    }) => transactionService.updateTransaction(db, user!.id, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      triggerSync();
    },
  });
}

export function useDeleteTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => transactionService.deleteTransaction(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      triggerSync();
    },
  });
}
