import type { CategoryType, AppSettings } from "./types.js";

export interface SeedCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  subcategories?: Omit<SeedCategory, "type" | "subcategories">[];
}

export const defaultExpenseCategories: SeedCategory[] = [
  { name: "Food", type: "expense", icon: "🍔", color: "#FF6B6B" },
  { name: "Transport", type: "expense", icon: "🚗", color: "#4ECDC4" },
  { name: "Mobile", type: "expense", icon: "📱", color: "#45B7D1" },
  { name: "Family", type: "expense", icon: "👨‍👩‍👧", color: "#F7DC6F" },
  { name: "Entertainment", type: "expense", icon: "🎬", color: "#BB8FCE" },
  { name: "Charity", type: "expense", icon: "🤲", color: "#82E0AA" },
  { name: "Games", type: "expense", icon: "🎮", color: "#F0B27A" },
  { name: "Flowers", type: "expense", icon: "💐", color: "#F1948A" },
  { name: "My Self", type: "expense", icon: "🧑", color: "#85C1E9" },
  { name: "Arshiya", type: "expense", icon: "👶", color: "#D7BDE2" },
];

export const defaultIncomeCategories: SeedCategory[] = [
  { name: "Salary", type: "income", icon: "💰", color: "#58D68D" },
];

export const defaultSettings: AppSettings = {
  currency_symbol: "₹",
  currency_code: "INR",
  start_screen: "daily",
  monthly_start_date: 1,
  weekly_start_day: "monday",
  carry_over: true,
  passcode: null,
  passcode_enabled: false,
  alarm_enabled: true,
  alarm_time: "21:00",
  show_description: true,
  autocomplete: true,
  input_order: "amount",
  subcategory_enabled: true,
  swipe_action: "change_date",
  theme: "system",
};

export const defaultAccountName = "Account";
