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
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.all, data),
  });
};
