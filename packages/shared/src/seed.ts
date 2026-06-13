import type { CategoryType, AppSettings } from "./types";

export interface SeedCategory {
  name: string;
  type: CategoryType;
  color: string;
  subcategories?: Omit<SeedCategory, "type" | "subcategories">[];
}

export const defaultExpenseCategories: SeedCategory[] = [
  { name: "Food", type: "expense", color: "#FF6B6B" },
  { name: "Transport", type: "expense", color: "#4ECDC4" },
  { name: "Mobile", type: "expense", color: "#45B7D1" },
  { name: "Family", type: "expense", color: "#F7DC6F" },
  { name: "Entertainment", type: "expense", color: "#BB8FCE" },
  { name: "Charity", type: "expense", color: "#82E0AA" },
  { name: "Games", type: "expense", color: "#F0B27A" },
  { name: "Flowers", type: "expense", color: "#F1948A" },
  { name: "My Self", type: "expense", color: "#85C1E9" },
  { name: "Arshiya", type: "expense", color: "#D7BDE2" },
];

export const defaultIncomeCategories: SeedCategory[] = [
  { name: "Salary", type: "income", color: "#58D68D" },
  { name: "Allowance", type: "income", color: "#5DADE2" },
  { name: "Bonus", type: "income", color: "#48C9B0" },
  { name: "Petty Cash", type: "income", color: "#F5B041" },
  { name: "Investments", type: "income", color: "#AF7AC5" },
  { name: "Other", type: "income", color: "#99A3A4" },
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
  contacts_enabled: false,
  contacts_required: { income: false, expense: false, transfer: false },
  locations_enabled: false,
  locations_required: { income: false, expense: false, transfer: false },
};

export const defaultAccountName = "Account";
