import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import * as smsImportService from "../services/sms-import-service";
import { checkSmsPermission, isSmsPlatform } from "../lib/sms-permission";
import { useSettings } from "./use-settings";

export const smsImportKeys = {
  all: ["smsImports"] as const,
  list: (status: smsImportService.SmsImportStatus, userId?: string) =>
    [...smsImportKeys.all, "list", status, userId] as const,
  pendingCount: (userId?: string) =>
    [...smsImportKeys.all, "pendingCount", userId] as const,
};

// Everything an import (manual or auto) can touch.
const IMPORT_SIDE_EFFECT_KEYS = [
  "transactions",
  "accounts",
  "categories",
  "debts",
  "stats",
] as const;

export function useSmsImports(status: smsImportService.SmsImportStatus) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: smsImportKeys.list(status, user?.id),
    queryFn: () => smsImportService.getSmsImports(db, user!.id, status),
    enabled: !!user,
    initialData: [],
  });
}

export function usePendingSmsCount() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: smsImportKeys.pendingCount(user?.id),
    queryFn: () => smsImportService.getPendingSmsCount(db, user!.id),
    enabled: !!user && isSmsPlatform(),
    initialData: 0,
  });
}

/**
 * One sms_import plus the account its bank previously mapped to — everything
 * the add-transaction form needs to prefill an import.
 */
export function useSmsImportPrefill(smsImportId: number | null) {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: [...smsImportKeys.all, "prefill", smsImportId, user?.id],
    queryFn: async () => {
      const sms = await smsImportService.getSmsImportById(
        db,
        user!.id,
        smsImportId!,
      );
      if (!sms) return null;
      const mappedAccountId = await smsImportService.findAccountForSender(
        db,
        user!.id,
        sms.bankCode,
        sms.accountLast4,
      );
      const rule = await smsImportService.findMerchantRule(
        db,
        user!.id,
        sms.counterparty,
      );
      return { sms, mappedAccountId, rule };
    },
    enabled: !!user && smsImportId != null,
  });
}

/**
 * After saving an imported transaction: link it to the SMS and remember the
 * user's category/account choices for one-tap repeats and auto-import.
 */
export function useLinkSmsImport() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      smsImportId: number;
      transactionId: number;
      choices: Parameters<typeof smsImportService.rememberImportChoices>[2];
    }) => {
      await smsImportService.markSmsImported(
        db,
        user!.id,
        input.smsImportId,
        input.transactionId,
      );
      await smsImportService.rememberImportChoices(db, user!.id, input.choices);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smsImportKeys.all });
    },
  });
}

/** Manual scan (SMS-inbox screen refresh / first enable). */
export function useScanSms() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opts: { fullRescan?: boolean } = {}) => {
      const result = await smsImportService.scanSms(db, user!.id, opts);
      let autoImported = 0;
      if (settings.smsAutoImport) {
        autoImported = await smsImportService.autoImportPending(db, user!.id);
      }
      return { ...result, autoImported };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: smsImportKeys.all });
      if (result.autoImported > 0) {
        for (const key of IMPORT_SIDE_EFFECT_KEYS) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    },
  });
}

export function useSetSmsStatus() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "pending" | "dismissed";
    }) => smsImportService.setSmsStatus(db, user!.id, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smsImportKeys.all });
    },
  });
}

/**
 * Auto-import on cold start + every foreground, when the user enabled the
 * toggle and the READ_SMS permission is still granted. New messages from known
 * merchants become transactions silently; the rest land in Pending.
 */
export function useAutoImportSms() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const enabled = !!user && isSmsPlatform() && settings.smsAutoImport;

  const query = useQuery({
    queryKey: [...smsImportKeys.all, "autoImport", user?.id],
    queryFn: async () => {
      if (!(await checkSmsPermission())) return 0;
      await smsImportService.scanSms(db, user!.id);
      const imported = await smsImportService.autoImportPending(db, user!.id);
      queryClient.invalidateQueries({ queryKey: smsImportKeys.all });
      if (imported > 0) {
        for (const key of IMPORT_SIDE_EFFECT_KEYS) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
      return imported;
    },
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // refetch() bypasses staleTime, so re-check on every foreground.
  const { refetch } = query;
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [enabled, refetch]);

  return query;
}
