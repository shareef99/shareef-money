import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import { transactionKeys } from "./use-transactions";
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

// Run once when the app comes up: generate any transactions that fell due
// while the app was closed, then refresh the transaction + recurring caches.
export function useMaterializeRecurring() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...recurringKeys.all, "materialize", user?.id],
    queryFn: async () => {
      const created = await recurringService.materializeDueRecurring(db, user!.id);
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      }
      return created;
    },
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
