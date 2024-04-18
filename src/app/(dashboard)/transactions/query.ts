import { api } from "@/api";
import {
  errorNotification,
  loadingNotification,
  successNotification,
} from "@/helpers/notification";
import { Transaction } from "@/types/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Keys
export const transactionKeys = {
  all: ({ userId, month, year }: TransactionQuery) => [
    "transactions",
    "user id",
    userId,
    "month",
    month,
    "year",
    year,
  ],
  addTransaction: ["add transactions"],
} as const;

type TransactionQuery = {
  userId?: number;
  month: number;
  year: number;
};

// Queries
export const useTransactions = ({ userId, month, year }: TransactionQuery) => {
  return useQuery({
    queryKey: transactionKeys.all({ userId, month, year }),
    queryFn: async () => {
      if (!userId) return undefined;

      const data = await api
        .get(`transactions/monthly`, {
          searchParams: {
            user_id: userId,
            month: month,
            year: year,
          },
        })
        .json<{
          transactions: Transaction[];
        }>();
      return data;
    },
    enabled: !!userId,
  });
};

// Mutations
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: transactionKeys.addTransaction,
    mutationFn: async ({
      payload,
    }: {
      payload: Partial<Transaction>;
      refetchData: TransactionQuery;
    }) => {
      try {
        loadingNotification("Adding transaction...", { id: "add" });
        await api.post("transactions", { json: payload }).json();
        successNotification("Transaction added successfully", { id: "add" });
      } catch (error) {
        errorNotification("Failed to add transaction", { id: "add" });
      }
    },
    onSuccess: async (_, { refetchData }) => {
      await queryClient.invalidateQueries({
        queryKey: transactionKeys.all(refetchData),
      });
    },
  });
};
