import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as transactionService from "../services/transaction-service";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: Record<string, unknown>) => [...transactionKeys.all, "list", filters] as const,
  summary: (from: string, to: string) => [...transactionKeys.all, "summary", from, to] as const,
};

export function useTransactions(filters: {
  dateFrom?: Date;
  dateTo?: Date;
  type?: "income" | "expense" | "transfer";
}) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.list({
      userId: user?.id,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString(),
      type: filters.type,
    }),
    queryFn: () => transactionService.getTransactions(db, user!.id, filters),
    enabled: !!user,
  });
}

export function useTransactionsSummary(from: Date, to: Date) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: transactionKeys.summary(from.toISOString(), to.toISOString()),
    queryFn: () => transactionService.getTransactionsSummary(db, user!.id, from, to),
    enabled: !!user,
    initialData: { income: 0, expense: 0, net: 0 },
  });
}

export function useCreateTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof transactionService.createTransaction>[2]) =>
      transactionService.createTransaction(db, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      triggerSync();
    },
  });
}

export function useUpdateTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: Parameters<typeof transactionService.updateTransaction>[3];
    }) => transactionService.updateTransaction(db, user!.id, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      triggerSync();
    },
  });
}

export function useDeleteTransaction() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => transactionService.deleteTransaction(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      triggerSync();
    },
  });
}
