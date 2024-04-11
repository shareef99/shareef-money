import { DefaultValues } from "@/types/shared";

export type Category = DefaultValues & {
  name: string;
  is_income: boolean;
  user_id: number;
  sub_category: SubCategory[];
};

export type SubCategory = DefaultValues & {
  name: string;
  category_id: number;
};
