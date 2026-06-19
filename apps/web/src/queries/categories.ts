import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@shareef-money/shared/validation";
import { api } from "../lib/api";
import type { Category } from "../lib/types";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
} as const;

export const getCategories = () =>
  queryOptions({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/api/categories");
      return data;
    },
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryCreateInput) => {
      const { data } = await api.post<Category>("/api/categories", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CategoryUpdateInput }) => {
      const { data } = await api.patch<Category>(`/api/categories/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};

export const useArchiveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/categories/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};
