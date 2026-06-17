import type { TransactionType } from "@shareef-money/shared/types";

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  debt_lend: "You gave",
  debt_borrow: "You got",
};

// Debts are balance-sheet movements (not P&L), so they share the neutral
// "transfer" colour rather than income/expense red/green.
export const TYPE_TEXT: Record<TransactionType, string> = {
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
  debt_lend: "text-transfer",
  debt_borrow: "text-transfer",
};

export const TYPE_BORDER: Record<TransactionType, string> = {
  income: "border-income",
  expense: "border-expense",
  transfer: "border-transfer",
  debt_lend: "border-transfer",
  debt_borrow: "border-transfer",
};

export const TYPE_BG: Record<TransactionType, string> = {
  income: "bg-income",
  expense: "bg-expense",
  transfer: "bg-transfer",
  debt_lend: "bg-transfer",
  debt_borrow: "bg-transfer",
};
