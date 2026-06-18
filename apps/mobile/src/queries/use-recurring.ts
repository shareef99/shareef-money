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

// Note: due recurring transactions are materialized inside SyncProvider.sync(),
// right before each push, so they always sync in the same cycle.
