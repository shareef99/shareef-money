import { TransactionType } from "@/types/enums";
import { DefaultValues } from "@/types/shared";

export type Account = DefaultValues & {
  name: string;
  amount: number;
  description: string | null;
  is_hidden: boolean;
  user_id: number;
  transactions: Transaction[];
};

export type AccountCreate = {
  name: string;
  amount: number;
  description: string | null;
  is_hidden: boolean;
  user_id: number;
};

export type Transaction = DefaultValues & {
  user_id: number;
  account_id: number;
  category_id: number;
  type: TransactionType;
  notes: string | null;
  amount: number;
  transaction_at: string;
};
