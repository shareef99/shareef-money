import { clientApi } from "@/api";
import { Account, AccountCreate } from "@/types/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Keys
export const accountKeys = {
  all: (userId: number) => ["accounts", "user id", userId],
  create: ["accounts", "create"],
} as const;

// Queries
export const useAccounts = (userId: number) => {
  return useQuery({
    queryKey: accountKeys.all(userId),
    queryFn: async () => {
      const data = await clientApi
        .get(`accounts/by-user/${userId}`)
        .json<{ accounts: Account[] }>();

      return data;
    },
  });
};

// Mutation
export const useAddAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: accountKeys.create,
    mutationFn: async (payload: AccountCreate) => {
      await clientApi.post("accounts/", { json: payload }).json();
    },
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all(user_id) });
    },
  });
};
