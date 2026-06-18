import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  effectiveBudget,
  type BudgetData,
  type BudgetMap,
} from "@shareef-money/shared/calc";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as settingsService from "../services/settings-service";

// Re-exported from the shared calc package so existing imports keep working.
export { effectiveBudget };
export type { BudgetData, BudgetMap };

const BUDGETS_KEY = "budgets_v2";
const LEGACY_KEY = "monthly_budgets";

const EMPTY: BudgetData = { default: {}, months: {} };

export const budgetKeys = {
  all: ["budgets"] as const,
  data: (userId?: string) => [...budgetKeys.all, userId] as const,
};

async function load(db: ReturnType<typeof useDatabase>["db"], userId: string): Promise<BudgetData> {
  const raw = await settingsService.getSetting(db, userId, BUDGETS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<BudgetData>;
      return { default: parsed.default ?? {}, months: parsed.months ?? {} };
    } catch {
      return { default: {}, months: {} };
    }
  }
  // Migrate the old flat map (applied to every month) into `default`.
  const legacy = await settingsService.getSetting(db, userId, LEGACY_KEY);
  if (legacy) {
    try {
      return { default: JSON.parse(legacy) as BudgetMap, months: {} };
    } catch {
      return { default: {}, months: {} };
    }
  }
  return { default: {}, months: {} };
}

export function useBudgets() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: budgetKeys.data(user?.id),
    queryFn: () => load(db, user!.id),
    enabled: !!user,
    initialData: EMPTY,
  });
}

export function useSetBudget() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monthKey,
      categoryId,
      amount,
      applyToAll,
    }: {
      monthKey: string;
      categoryId: number;
      amount: number;
      applyToAll: boolean;
    }) => {
      const data = await load(db, user!.id);
      const id = String(categoryId);

      if (applyToAll) {
        if (amount > 0) data.default[id] = amount;
        else delete data.default[id];
        // A new default supersedes any prior month override for this category.
        for (const m of Object.keys(data.months)) delete data.months[m]?.[id];
      } else {
        const month = (data.months[monthKey] ??= {});
        if (amount > 0) month[id] = amount;
        else delete month[id];
      }

      await settingsService.setSetting(db, user!.id, BUDGETS_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      triggerSync();
    },
  });
}
