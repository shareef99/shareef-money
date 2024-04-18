export type WeekStartDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";
export const weekStartDays = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type TransactionType = "income" | "expense" | "transfer";
export const transactionTypes = ["income", "expense", "transfer"] as const;

export type CategoryType = "income" | "expense";
export const categoryTypes = ["income", "expense"] as const;
