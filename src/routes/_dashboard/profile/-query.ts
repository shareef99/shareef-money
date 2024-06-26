import { axiosClient } from "@/api";
import {
  errorNotification,
  loadingNotification,
  successNotification,
} from "@/helpers/notification";
import { Category, SubCategory } from "@/types/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Keys
export const profileKeys = {
  categories: (userId?: number) => ["categories", "user id", userId] as const,
  addCategory: ["add category"],
  addSubCategory: ["add sub category"],
} as const;

// Queries
export const useCategories = (userId?: number) => {
  return useQuery({
    queryKey: profileKeys.categories(userId),
    queryFn: async () => {
      const { data } = await axiosClient.get<{ categories: Category[] }>(
        `categories/user/${userId}`
      );
      return data;
    },
    enabled: !!userId,
  });
};

// Mutations
export const useAddCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: profileKeys.addCategory,
    mutationFn: async (payload: Partial<Category>) => {
      try {
        loadingNotification("Adding category...", { id: "add" });
        await axiosClient.post("categories", payload);
        successNotification("Category added successfully", { id: "add" });
      } catch (error) {
        errorNotification("Failed to add category", { id: "add" });
      }
    },
    onSuccess: async (_, { user_id }) => {
      await queryClient.invalidateQueries({
        queryKey: profileKeys.categories(user_id),
      });
    },
  });
};

export const useAddSubCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: profileKeys.addSubCategory,
    mutationFn: async ({
      payload,
    }: {
      payload: Partial<SubCategory>;
      userId: number;
    }) => {
      try {
        loadingNotification("Adding subcategory...", { id: "add" });
        await axiosClient.post("sub-categories", payload);
        successNotification("Subcategory added successfully", { id: "add" });
      } catch (error) {
        errorNotification("Failed to add subcategory", { id: "add" });
      }
    },
    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: profileKeys.categories(userId),
      });
    },
  });
};
