import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AccountCreatePayload,
  AccountUpdatePayload,
} from "@shareef-money/shared/validation";
import { api } from "../lib/api";
import type { Account } from "../lib/types";

export const accountKeys = {
  all: ["accounts"] as const,
  list: () => [...accountKeys.all, "list"] as const,
} as const;

export const getAccounts = () =>
  queryOptions({
    queryKey: accountKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Account[]>("/api/accounts");
      return data;
    },
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AccountCreatePayload) => {
      const { data } = await api.post<Account>("/api/accounts", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AccountUpdatePayload }) => {
      const { data } = await api.patch<Account>(`/api/accounts/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};

export const useArchiveAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/accounts/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  });
};
