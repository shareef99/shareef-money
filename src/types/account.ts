import { Category } from "@/types/category";
import { TransactionType } from "@/types/enums";

export type Account = {
  id: number;
  name: string;
  amount: number;
  description: string | null;
  is_hidden: boolean;
  user_id: number;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
};

export type AccountCreate = {
  name: string;
  amount: number;
  description: string | null;
  is_hidden: boolean;
  user_id: number;
};

export type Transaction = {
  id: number;
  type: TransactionType;
  notes: string | null;
  amount: number;
  transaction_at: string;
  user_id: number;
  account_id: number;
  category_id: number;
  sub_category_id: number;
  category: Category;
  account: Account;
  createdAt: string;
  updatedAt: string;
};
