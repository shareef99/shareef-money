import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as settingsService from "../services/settings-service";
import { toStored, type StatsFilter, type StoredFilter } from "../lib/stats-filter";

const KEY = "stats_saved_views";

export type SavedView = { id: number; name: string; filter: StoredFilter };

const viewKeys = {
  all: ["stats-views"] as const,
  list: (userId?: string) => [...viewKeys.all, userId] as const,
};

async function load(
  db: ReturnType<typeof useDatabase>["db"],
  userId: string,
): Promise<SavedView[]> {
  const raw = await settingsService.getSetting(db, userId, KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
  } catch {
    return [];
  }
}

export function useSavedViews() {
  const { db } = useDatabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: viewKeys.list(user?.id),
    queryFn: () => load(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}

export function useSaveView() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, filter }: { name: string; filter: StatsFilter }) => {
      const views = await load(db, user!.id);
      // Stable, monotonic id without Date — one past the current max.
      const id = views.reduce((m, v) => Math.max(m, v.id), 0) + 1;
      const next = [...views, { id, name, filter: toStored(filter) }];
      await settingsService.setSetting(db, user!.id, KEY, JSON.stringify(next));
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viewKeys.all });
      triggerSync();
    },
  });
}

export function useDeleteView() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const views = await load(db, user!.id);
      const next = views.filter((v) => v.id !== id);
      await settingsService.setSetting(db, user!.id, KEY, JSON.stringify(next));
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viewKeys.all });
      triggerSync();
    },
  });
}
