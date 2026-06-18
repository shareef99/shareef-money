import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/api";
import type { SettingsMap } from "../lib/types";

export const settingsKeys = {
  all: ["settings"] as const,
} as const;

export const getSettings = () =>
  queryOptions({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const { data } = await api.get<SettingsMap>("/api/settings");
      return data;
    },
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: SettingsMap) => {
      const { data } = await api.patch<SettingsMap>("/api/settings", patch);
      return data;
    },
    // Optimistically merge so toggles/selects flip instantly.
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previous = queryClient.getQueryData<SettingsMap>(settingsKeys.all);
      queryClient.setQueryData<SettingsMap>(settingsKeys.all, (old) => ({
        ...(old ?? {}),
        ...patch,
      }));
      return { previous };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(settingsKeys.all, ctx.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.all, data),
  });
};
