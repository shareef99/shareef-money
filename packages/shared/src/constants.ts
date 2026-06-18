export const ALL_TIME_FROM = new Date(2000, 0, 1);
export const ALL_TIME_TO = new Date(2100, 0, 1);

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const TRANSACTION_TYPE_TABS = [
  { type: "income", label: "Income" },
  { type: "expense", label: "Expense" },
  { type: "transfer", label: "Transfer" },
] as const;

// Debt entry directions (Khatabook-style). Added from the Debts tab, not the
// main add screen, so the income/expense/transfer tabs stay uncluttered.
export const DEBT_TYPE_TABS = [
  { type: "debt_lend", label: "You gave" },
  { type: "debt_borrow", label: "You got" },
] as const;
