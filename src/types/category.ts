import { CategoryType } from "@/types/enums";

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  user_id: number;
  sub_categories: SubCategory[];
  createdAt: string;
  updatedAt: string;
};

export type SubCategory = {
  id: number;
  name: string;
  category_id: number;
  createdAt: string;
  updatedAt: string;
};
