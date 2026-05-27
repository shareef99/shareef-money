export const transactionTypes = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const categoryTypes = ["income", "expense"] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const frequencies = ["daily", "weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof frequencies)[number];

export const statsPeriods = ["weekly", "monthly", "annually", "custom"] as const;
export type StatsPeriod = (typeof statsPeriods)[number];

export const authProviders = ["email", "google"] as const;
export type AuthProvider = (typeof authProviders)[number];

export const deviceTypes = ["mobile", "web"] as const;
export type DeviceType = (typeof deviceTypes)[number];

export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type WeekDay = (typeof weekDays)[number];

export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

export const startScreens = ["daily", "calendar"] as const;
export type StartScreen = (typeof startScreens)[number];

export const inputOrders = ["amount", "category"] as const;
export type InputOrder = (typeof inputOrders)[number];

export const swipeActions = ["change_date", "change_tab"] as const;
export type SwipeAction = (typeof swipeActions)[number];

// ── Settings interface ───────────────────────────────────────

export interface AppSettings {
  currency_symbol: string;
  currency_code: string;
  start_screen: StartScreen;
  monthly_start_date: number;
  weekly_start_day: WeekDay;
  carry_over: boolean;
  passcode: string | null;
  passcode_enabled: boolean;
  alarm_enabled: boolean;
  alarm_time: string;
  show_description: boolean;
  autocomplete: boolean;
  input_order: InputOrder;
  subcategory_enabled: boolean;
  swipe_action: SwipeAction;
  theme: Theme;
}
