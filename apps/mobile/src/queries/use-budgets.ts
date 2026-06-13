import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as settingsService from "../services/settings-service";

const BUDGETS_KEY = "monthly_budgets";

export type BudgetMap = Record<string, number>; // categoryId -> amount (smallest unit)

export const budgetKeys = {
  all: ["budgets"] as const,
  map: (userId?: string) => [...budgetKeys.all, userId] as const,
};

export function useBudgets() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: budgetKeys.map(user?.id),
    queryFn: async (): Promise<BudgetMap> => {
      const raw = await settingsService.getSetting(db, user!.id, BUDGETS_KEY);
      if (!raw) return {};
      try {
        return JSON.parse(raw) as BudgetMap;
      } catch {
        return {};
      }
    },
    enabled: !!user,
    initialData: {},
  });
}

export function useSetBudget() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, amount }: { categoryId: number; amount: number }) => {
      const raw = await settingsService.getSetting(db, user!.id, BUDGETS_KEY);
      const map: BudgetMap = raw ? (JSON.parse(raw) as BudgetMap) : {};
      if (amount > 0) {
        map[String(categoryId)] = amount;
      } else {
        delete map[String(categoryId)];
      }
      await settingsService.setSetting(db, user!.id, BUDGETS_KEY, JSON.stringify(map));
      return map;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      triggerSync();
    },
  });
}
