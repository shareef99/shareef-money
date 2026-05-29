import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import * as categoryService from "../services/category-service";

export const categoryKeys = {
  all: ["categories"] as const,
  byType: (type?: string) => [...categoryKeys.all, "byType", type ?? "all"] as const,
};

export function useCategories(type?: "income" | "expense") {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: categoryKeys.byType(type),
    queryFn: () => categoryService.getCategories(db, user!.id, type),
    enabled: !!user,
    initialData: [],
  });
}
