import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as recurringService from "../services/recurring-service";

export const recurringKeys = {
  all: ["recurring"] as const,
  list: (userId?: string) => [...recurringKeys.all, userId] as const,
};

export function useRecurringRules() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: recurringKeys.list(user?.id),
    queryFn: () => recurringService.getRecurringRules(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}

export function useCreateRecurringRule() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof recurringService.createRecurringRule>[2]) =>
      recurringService.createRecurringRule(db, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      triggerSync();
    },
  });
}

export function useToggleRecurring() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      recurringService.setRecurringActive(db, user!.id, id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      triggerSync();
    },
  });
}

export function useDeleteRecurringRule() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      recurringService.deleteRecurringRule(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      triggerSync();
    },
  });
}

// Post any recurring transactions that have come due. This is the ONLY driver of
// recurring in the local-first build — it used to piggyback on SyncProvider.sync(),
// which is now dormant (SYNC_ENABLED=false), so without this a "repeat" rule would
// store a next-occurrence date but never actually generate the transaction.
//
// Runs once on cold start (staleTime: Infinity) and again whenever the app returns
// to the foreground, so occurrences that fell due while the app was closed or
// backgrounded still post. Mounted in the tab layout alongside the other boot jobs.
export function useMaterializeRecurring() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...recurringKeys.all, "materialize", user?.id],
    queryFn: async () => {
      const created = await recurringService.materializeDueRecurring(db, user!.id);
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: recurringKeys.all });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["debts"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
      return created;
    },
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // refetch() bypasses staleTime, so re-check on every foreground.
  const { refetch } = query;
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  return query;
}
