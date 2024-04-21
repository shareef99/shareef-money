import { Transaction } from "@/types/transaction";

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
