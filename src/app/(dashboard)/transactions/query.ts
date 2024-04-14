import { api } from "@/api";
import {
  errorNotification,
  loadingNotification,
  successNotification,
} from "@/helpers/notification";
import { Transaction } from "@/types/account";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Keys
export const transactionKeys = {
  all: (user_id?: number) => ["transactions", "all", user_id],
  addTransaction: ["add transactions"],
} as const;

// Mutations
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: transactionKeys.addTransaction,
    mutationFn: async (payload: Partial<Transaction>) => {
      try {
        loadingNotification("Adding transaction...", { id: "add" });
        await api.post("transactions", { json: payload }).json();
        successNotification("Transaction added successfully", { id: "add" });
      } catch (error) {
        errorNotification("Failed to add transaction", { id: "add" });
      }
    },
    onSuccess: async (_, { user_id }) => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all(user_id),
      });
    },
  });
};
