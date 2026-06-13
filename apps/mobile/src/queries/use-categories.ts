import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as categoryService from "../services/category-service";

export const categoryKeys = {
  all: ["categories"] as const,
  byType: (type?: string) => [...categoryKeys.all, "byType", type ?? "all"] as const,
  byId: (id: number) => [...categoryKeys.all, "byId", id] as const,
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

export function useCreateCategory() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof categoryService.createCategory>[2]) =>
      categoryService.createCategory(db, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      triggerSync();
    },
  });
}

export function useUpdateCategory() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: Parameters<typeof categoryService.updateCategory>[3];
    }) => categoryService.updateCategory(db, user!.id, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      triggerSync();
    },
  });
}

export function useArchiveCategory() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.archiveCategory(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      triggerSync();
    },
  });
}

export function useReorderCategories() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      categoryService.reorderCategories(db, user!.id, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      triggerSync();
    },
  });
}
