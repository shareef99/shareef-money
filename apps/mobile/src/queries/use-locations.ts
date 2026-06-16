import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as locationService from "../services/location-service";

export const locationKeys = {
  all: ["locations"] as const,
  list: (userId?: string) => [...locationKeys.all, "list", userId] as const,
};

export function useLocations() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: locationKeys.list(user?.id),
    queryFn: () => locationService.getLocations(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}

export function useCreateLocation() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => locationService.createLocation(db, user!.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
      triggerSync();
    },
  });
}

export function useUpdateLocation() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      locationService.updateLocation(db, user!.id, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
      triggerSync();
    },
  });
}

export function useArchiveLocation() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => locationService.archiveLocation(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
      triggerSync();
    },
  });
}
