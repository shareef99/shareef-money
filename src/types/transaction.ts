import { Account } from "@/types/account";
import { Category, SubCategory } from "@/types/category";
import { TransactionType } from "@/types/enums";

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
  sub_category: SubCategory;
  account: Account;
  createdAt: string;
  updatedAt: string;
};
