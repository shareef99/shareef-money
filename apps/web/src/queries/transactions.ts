import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { TransactionType } from "@shareef-money/shared/types";
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
} from "@shareef-money/shared/validation";
import { api } from "../lib/api";
import { accountKeys } from "./accounts";
import type { Transaction } from "../lib/types";

export type TransactionFilters = {
  type?: TransactionType;
  dateFrom?: number;
  dateTo?: number;
  accountIds?: number[];
  categoryIds?: number[];
  limit?: number;
  offset?: number;
};

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.all, "list", filters] as const,
} as const;

export const getTransactions = (filters: TransactionFilters = {}) =>
  queryOptions({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: String(filters.limit ?? 500),
        offset: String(filters.offset ?? 0),
      };
      if (filters.type) params.type = filters.type;
      if (filters.dateFrom != null) params.dateFrom = String(filters.dateFrom);
      if (filters.dateTo != null) params.dateTo = String(filters.dateTo);
      if (filters.accountIds?.length) params.accountIds = filters.accountIds.join(",");
      if (filters.categoryIds?.length) params.categoryIds = filters.categoryIds.join(",");
      const { data } = await api.get<Transaction[]>("/api/transactions", { params });
      return data;
    },
  });

function invalidateAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  // Balances and net worth derive from transactions.
  queryClient.invalidateQueries({ queryKey: accountKeys.all });
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionCreateInput) => {
      const { data } = await api.post<Transaction>("/api/transactions", payload);
      return data;
    },
    onSettled: () => invalidateAfterMutation(queryClient),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: TransactionUpdateInput }) => {
      const { data } = await api.patch<Transaction>(`/api/transactions/${id}`, payload);
      return data;
    },
    // Optimistically merge the changed fields into every cached list.
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const snapshots = queryClient.getQueriesData<Transaction[]>({
        queryKey: transactionKeys.all,
      });
      // The raw update input encodes dates as epoch numbers and contacts as a
      // number[], whereas a cached Transaction uses ISO strings and a joined
      // contactIds string. Merge only the representation-compatible fields and
      // convert the dates so the optimistic row stays a valid Transaction.
      // contactIds (number[]) is dropped from the optimistic merge — the cached
      // Transaction carries the joined-string form, refreshed on settle.
      const { date, dueDate, contactIds: _contactIds, ...rest } = payload;
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionKeys.all },
        (old) =>
          old?.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...rest,
                  ...(date != null ? { date: new Date(date).toISOString() } : {}),
                  ...(dueDate !== undefined
                    ? { dueDate: dueDate == null ? null : new Date(dueDate).toISOString() }
                    : {}),
                }
              : t,
          ),
      );
      return { snapshots };
    },
    onError: (_e, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateAfterMutation(queryClient),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/transactions/${id}`);
    },
    // Optimistically remove the row from every cached list.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const snapshots = queryClient.getQueriesData<Transaction[]>({
        queryKey: transactionKeys.all,
      });
      queryClient.setQueriesData<Transaction[]>(
        { queryKey: transactionKeys.all },
        (old) => old?.filter((t) => t.id !== id),
      );
      return { snapshots };
    },
    onError: (_e, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateAfterMutation(queryClient),
  });
};
