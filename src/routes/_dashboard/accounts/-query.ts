import { axiosClient } from "@/api";
import {
  errorNotification,
  loadingNotification,
  successNotification,
} from "@/helpers/notification";
import { Account, AccountCreate } from "@/types/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Keys
export const accountKeys = {
  all: (userId?: number) => ["accounts", "user id", userId],
  create: ["accounts", "create"],
} as const;

// Queries
export const useAccounts = (userId?: number) => {
  return useQuery({
    queryKey: accountKeys.all(userId),
    queryFn: async () => {
      const { data } = await axiosClient.get<{ accounts: Account[] }>(
        `accounts/user/${userId}`
      );

      return data;
    },
    enabled: !!userId,
  });
};

// Mutation
export const useAddAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: accountKeys.create,
    mutationFn: async (payload: AccountCreate) => {
      try {
        loadingNotification("Adding account...", { id: "add" });
        await axiosClient.post("accounts/", payload);
        successNotification("Account added successfully", { id: "add" });
      } catch (error) {
        errorNotification("Failed to add account", { id: "add" });
      }
    },
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all(user_id) });
    },
  });
};
