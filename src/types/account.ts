import { DefaultValues } from "@/types/shared";

export type Account = DefaultValues & {
  name: string;
  amount: number;
  description: string | null;
  is_hidden: boolean;
  user_id: number;
};
