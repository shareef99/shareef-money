export const ALL_TIME_FROM = new Date(2000, 0, 1);
export const ALL_TIME_TO = new Date(2100, 0, 1);

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const TRANSACTION_TYPE_TABS = [
  { type: "income", label: "Income" },
  { type: "expense", label: "Expense" },
  { type: "transfer", label: "Transfer" },
] as const;
