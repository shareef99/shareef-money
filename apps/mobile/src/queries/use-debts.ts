import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as debtService from "../services/debt-service";
import { syncDebtReminders } from "../lib/notifications";

export const debtKeys = {
  all: ["debts"] as const,
  ledger: (userId?: string) => [...debtKeys.all, "ledger", userId] as const,
  contact: (userId?: string, contactId?: number) =>
    [...debtKeys.all, "contact", userId, contactId] as const,
  netWorth: (userId?: string) => [...debtKeys.all, "net-worth", userId] as const,
};

export function useDebtLedger() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: debtKeys.ledger(user?.id),
    queryFn: () => debtService.getDebtLedger(db, user!.id),
    enabled: !!user,
    initialData: { people: [], receivable: 0, payable: 0, net: 0 },
  });
}

export function useContactDebtEntries(contactId: number | null) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: debtKeys.contact(user?.id, contactId ?? undefined),
    queryFn: () => debtService.getContactDebtEntries(db, user!.id, contactId!),
    enabled: !!user && contactId != null,
    initialData: { entries: [], net: 0, name: "" },
  });
}

export function useNetWorth() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: debtKeys.netWorth(user?.id),
    queryFn: () => debtService.getNetWorth(db, user!.id),
    enabled: !!user,
    initialData: { accountsTotal: 0, receivable: 0, payable: 0, netWorth: 0 },
  });
}

export function useWriteOffDebt() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, name }: { contactId: number; name: string }) =>
      debtService.writeOffDebt(db, user!.id, contactId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      triggerSync();
    },
  });
}

// Keep local notifications in sync with open debts that have a due date.
// Runs on mount and whenever the ledger changes (mutations invalidate it).
export function useDebtReminders() {
  const { data } = useDebtLedger();

  useEffect(() => {
    syncDebtReminders(
      data.people.map((p) => ({
        contactId: p.contactId,
        name: p.name,
        net: p.net,
        dueDate: p.dueDate,
      })),
    ).catch(() => {});
  }, [data.people]);
}
