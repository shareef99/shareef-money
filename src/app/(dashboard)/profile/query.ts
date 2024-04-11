import { api } from "@/api";
import { Category } from "@/types/category";
import { useQuery } from "@tanstack/react-query";

// Keys
export const profileKeys = {
  categories: (userId?: number) => ["categories", "user id", userId],
} as const;

// Queries
export const useCategories = (userId?: number) => {
  return useQuery({
    queryKey: profileKeys.categories(userId),
    queryFn: async () => {
      const data = await api
        .get(`categories/by-user/${userId}`)
        .json<{ categories: Category[] }>();
      return data;
    },
  });
};
