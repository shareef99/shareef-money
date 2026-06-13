import type { TransactionType } from "@shareef-money/shared/types";

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

export const TYPE_TEXT: Record<TransactionType, string> = {
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
};

export const TYPE_BORDER: Record<TransactionType, string> = {
  income: "border-income",
  expense: "border-expense",
  transfer: "border-transfer",
};

export const TYPE_BG: Record<TransactionType, string> = {
  income: "bg-income",
  expense: "bg-expense",
  transfer: "bg-transfer",
};
