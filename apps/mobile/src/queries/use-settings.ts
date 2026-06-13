import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as settingsService from "../services/settings-service";

export type SwipeAction = "change_date" | "change_tab";

export type AppSettings = {
  swipeAction: SwipeAction;
  incomeCarryForward: boolean;
  requireSubcategory: boolean;
  requireLocation: boolean;
  requireContact: boolean;
};

export const SETTING_KEYS = {
  swipeAction: "swipe_action",
  incomeCarryForward: "income_carry_forward",
  requireSubcategory: "require_subcategory",
  requireLocation: "require_location",
  requireContact: "require_contact",
} as const;

const DEFAULTS: AppSettings = {
  swipeAction: "change_date",
  incomeCarryForward: false,
  requireSubcategory: false,
  requireLocation: false,
  requireContact: false,
};

function parse(map: Record<string, string>): AppSettings {
  const bool = (k: string, d: boolean) =>
    map[k] === undefined ? d : map[k] === "true";
  return {
    swipeAction:
      map[SETTING_KEYS.swipeAction] === "change_tab" ? "change_tab" : "change_date",
    incomeCarryForward: bool(SETTING_KEYS.incomeCarryForward, DEFAULTS.incomeCarryForward),
    requireSubcategory: bool(SETTING_KEYS.requireSubcategory, DEFAULTS.requireSubcategory),
    requireLocation: bool(SETTING_KEYS.requireLocation, DEFAULTS.requireLocation),
    requireContact: bool(SETTING_KEYS.requireContact, DEFAULTS.requireContact),
  };
}

export const settingKeys = {
  all: ["settings"] as const,
  map: (userId?: string) => [...settingKeys.all, userId] as const,
};

export function useSettings() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: settingKeys.map(user?.id),
    queryFn: async () => parse(await settingsService.getAllSettings(db, user!.id)),
    enabled: !!user,
    initialData: DEFAULTS,
  });
}

export function useSetSetting() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settingsService.setSetting(db, user!.id, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      triggerSync();
    },
  });
}
