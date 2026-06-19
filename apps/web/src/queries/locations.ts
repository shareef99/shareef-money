import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  LocationCreateInput,
  LocationUpdateInput,
} from "@shareef-money/shared/validation";
import { api } from "../lib/api";
import type { Location } from "../lib/types";

export const locationKeys = {
  all: ["locations"] as const,
  list: () => [...locationKeys.all, "list"] as const,
} as const;

export const getLocations = () =>
  queryOptions({
    queryKey: locationKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Location[]>("/api/locations");
      return data;
    },
  });

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LocationCreateInput) => {
      const { data } = await api.post<Location>("/api/locations", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: LocationUpdateInput }) => {
      const { data } = await api.patch<Location>(`/api/locations/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
};

export const useArchiveLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/locations/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all }),
  });
};
