import type { CategoryType, AppSettings } from "./types";

export interface SeedCategory {
  name: string;
  type: CategoryType;
  color: string;
  subcategories?: Omit<SeedCategory, "type" | "subcategories">[];
}

export const defaultExpenseCategories: SeedCategory[] = [
  { 
    name: "Food", type: "expense", color: "#FF6B6B",
    subcategories: [
      { name: "Groceries", color: "#FF9999" },
      { name: "Restaurants", color: "#FF4D4D" },
      { name: "Coffee", color: "#FFB366" },
    ]
  },
  { 
    name: "Transport", type: "expense", color: "#4ECDC4",
    subcategories: [
      { name: "Public Transit", color: "#79D9D2" },
      { name: "Taxi/Ride", color: "#2EABA2" },
      { name: "Fuel", color: "#A3E4DF" },
    ]
  },
  { 
    name: "Mobile", type: "expense", color: "#45B7D1",
    subcategories: [
      { name: "Plan/Recharge", color: "#70CDE2" },
      { name: "Accessories", color: "#2B98B0" },
    ]
  },
  { 
    name: "Family", type: "expense", color: "#F7DC6F",
    subcategories: [
      { name: "Kids", color: "#F9E79F" },
      { name: "Home Needs", color: "#F4D03F" },
    ]
  },
  { 
    name: "Entertainment", type: "expense", color: "#BB8FCE",
    subcategories: [
      { name: "Movies", color: "#D2B4DE" },
      { name: "Subscriptions", color: "#A569BD" },
    ]
  },
  { 
    name: "Charity", type: "expense", color: "#82E0AA",
    subcategories: [
      { name: "Donations", color: "#A9DFBF" },
      { name: "Zakat", color: "#58D68D" },
    ]
  },
  { 
    name: "Games", type: "expense", color: "#F0B27A",
    subcategories: [
      { name: "PC/Console", color: "#F5CBA7" },
      { name: "In-App", color: "#EB984E" },
    ]
  },
  { 
    name: "Flowers", type: "expense", color: "#F1948A",
    subcategories: [
      { name: "Gifts", color: "#F5B7B1" },
      { name: "Decor", color: "#EC7063" },
    ]
  },
  { 
    name: "My Self", type: "expense", color: "#85C1E9",
    subcategories: [
      { name: "Clothing", color: "#AED6F1" },
      { name: "Personal Care", color: "#5DADE2" },
    ]
  },
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
