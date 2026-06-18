import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BudgetData, BudgetMap } from "@shareef-money/shared/calc";
import { api } from "../lib/api";
import { settingsKeys } from "./settings";
import type { SettingsMap } from "../lib/types";

// Budgets ride inside the settings table as a single JSON blob (matching the
// mobile app) rather than a dedicated endpoint, so reads come from the cached
// settings map and writes go through the generic settings PATCH.
const BUDGETS_KEY = "budgets_v2";
const LEGACY_KEY = "monthly_budgets";

const EMPTY: BudgetData = { default: {}, months: {} };

export function parseBudgets(settings: SettingsMap): BudgetData {
  const raw = settings[BUDGETS_KEY];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<BudgetData>;
      return { default: parsed.default ?? {}, months: parsed.months ?? {} };
    } catch {
      return { default: {}, months: {} };
    }
  }
  // Migrate the legacy flat map (one budget per category, every month).
  const legacy = settings[LEGACY_KEY];
  if (legacy) {
    try {
      return { default: JSON.parse(legacy) as BudgetMap, months: {} };
    } catch {
      return EMPTY;
    }
  }
  return EMPTY;
}

export const useSetBudget = () => {
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
      const settings = queryClient.getQueryData<SettingsMap>(settingsKeys.all) ?? {};
      const data = parseBudgets(settings);
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

      const { data: updated } = await api.patch<SettingsMap>("/api/settings", {
        [BUDGETS_KEY]: JSON.stringify(data),
      });
      return updated;
    },
    onSuccess: (updated) => queryClient.setQueryData(settingsKeys.all, updated),
  });
};
