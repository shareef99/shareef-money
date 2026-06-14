import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as accountService from "../services/account-service";

export const accountKeys = {
  all: ["accounts"] as const,
  list: (userId?: string) => [...accountKeys.all, "list", userId] as const,
  balances: (userId?: string) => [...accountKeys.all, "balances", userId] as const,
};

export function useAccounts() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: accountKeys.list(user?.id),
    queryFn: () => accountService.getAccounts(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}

// One-time-ish: convert any legacy account opening balances into income
// transactions on launch (no-op once all accounts have been migrated).
export function useMigrateOpeningBalances() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...accountKeys.all, "migrate-opening", user?.id],
    queryFn: async () => {
      const migrated = await accountService.migrateOpeningBalances(db, user!.id);
      if (migrated > 0) {
        queryClient.invalidateQueries({ queryKey: accountKeys.all });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        triggerSync();
      }
      return migrated;
    },
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAccountsWithBalances() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: accountKeys.balances(user?.id),
    queryFn: () => accountService.getAccountsWithBalances(db, user!.id),
    enabled: !!user,
    initialData: { accounts: [], total: 0 },
  });
}

export function useCreateAccount() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof accountService.createAccount>[2]) =>
      accountService.createAccount(db, user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      // Creating an account may also create an Opening Balance income entry
      // (and its category), so refresh those caches too.
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      triggerSync();
    },
  });
}

export function useUpdateAccount() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: Parameters<typeof accountService.updateAccount>[3];
    }) => accountService.updateAccount(db, user!.id, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      triggerSync();
    },
  });
}

export function useArchiveAccount() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => accountService.archiveAccount(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      triggerSync();
    },
  });
}

export function useReorderAccounts() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      accountService.reorderAccounts(db, user!.id, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      triggerSync();
    },
  });
}
