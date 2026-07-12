import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrencyByCode } from "@shareef-money/shared/utils";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as settingsService from "../services/settings-service";

export type SwipeAction = "change_date" | "change_tab";
export type StartScreen = "transactions" | "stats" | "accounts" | "debts";
export type WeekStartDay = "sunday" | "monday";

export type AppSettings = {
  swipeAction: SwipeAction;
  incomeCarryForward: boolean;
  requireSubcategory: boolean;
  requireLocation: boolean;
  requireContact: boolean;
  startScreen: StartScreen;
  weekStartDay: WeekStartDay;
  // Day of month (1-28) the financial month begins on.
  monthStartDay: number;
  reminderEnabled: boolean;
  // 24h "HH:MM" for the daily reminder.
  reminderTime: string;
  // ISO 4217 currency code, e.g. "INR".
  currencyCode: string;
};

export const SETTING_KEYS = {
  swipeAction: "swipe_action",
  incomeCarryForward: "income_carry_forward",
  requireSubcategory: "require_subcategory",
  requireLocation: "require_location",
  requireContact: "require_contact",
  startScreen: "start_screen",
  weekStartDay: "week_start_day",
  monthStartDay: "month_start_day",
  reminderEnabled: "reminder_enabled",
  reminderTime: "reminder_time",
  currencyCode: "currency_code",
} as const;

const DEFAULTS: AppSettings = {
  swipeAction: "change_date",
  incomeCarryForward: false,
  requireSubcategory: false,
  requireLocation: false,
  requireContact: false,
  startScreen: "transactions",
  weekStartDay: "monday",
  monthStartDay: 1,
  reminderEnabled: false,
  reminderTime: "21:00",
  currencyCode: "INR",
};

const START_SCREENS: StartScreen[] = ["transactions", "stats", "accounts", "debts"];

function parse(map: Record<string, string>): AppSettings {
  const bool = (k: string, d: boolean) =>
    map[k] === undefined ? d : map[k] === "true";
  const monthStartDay = Number(map[SETTING_KEYS.monthStartDay]);
  return {
    swipeAction:
      map[SETTING_KEYS.swipeAction] === "change_tab" ? "change_tab" : "change_date",
    incomeCarryForward: bool(SETTING_KEYS.incomeCarryForward, DEFAULTS.incomeCarryForward),
    requireSubcategory: bool(SETTING_KEYS.requireSubcategory, DEFAULTS.requireSubcategory),
    requireLocation: bool(SETTING_KEYS.requireLocation, DEFAULTS.requireLocation),
    requireContact: bool(SETTING_KEYS.requireContact, DEFAULTS.requireContact),
    startScreen: START_SCREENS.includes(map[SETTING_KEYS.startScreen] as StartScreen)
      ? (map[SETTING_KEYS.startScreen] as StartScreen)
      : "transactions",
    weekStartDay:
      map[SETTING_KEYS.weekStartDay] === "sunday" ? "sunday" : "monday",
    monthStartDay:
      Number.isFinite(monthStartDay) && monthStartDay >= 1 && monthStartDay <= 28
        ? monthStartDay
        : 1,
    reminderEnabled: bool(SETTING_KEYS.reminderEnabled, DEFAULTS.reminderEnabled),
    reminderTime: map[SETTING_KEYS.reminderTime] || DEFAULTS.reminderTime,
    currencyCode: getCurrencyByCode(map[SETTING_KEYS.currencyCode]).code,
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
