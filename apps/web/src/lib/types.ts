import type { TransactionType } from "@shareef-money/shared/types";

// REST entity shapes. Dates arrive as ISO strings over JSON.
export type Account = {
  id: number;
  userId: string;
  name: string;
  initialBalance: number;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isHidden: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  userId: string;
  parentId: number | null;
  name: string;
  type: "income" | "expense";
  color: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: number;
  userId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  id: number;
  userId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

// As returned by GET /api/transactions (the list join enriches a few names).
export type Transaction = {
  id: number;
  userId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  categoryId: number | null;
  accountId: number;
  toAccountId: number | null;
  locationId: number | null;
  note: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  categoryColor: string | null;
  accountName: string | null;
};

export type SettingsMap = Record<string, string>;
