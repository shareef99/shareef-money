import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import { useSync } from "../providers/sync-provider";
import * as contactService from "../services/contact-service";

export const contactKeys = {
  all: ["contacts"] as const,
  list: (userId?: string) => [...contactKeys.all, "list", userId] as const,
};

export function useContacts() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: contactKeys.list(user?.id),
    queryFn: () => contactService.getContacts(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}

export function useCreateContact() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => contactService.createContact(db, user!.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      triggerSync();
    },
  });
}

export function useUpdateContact() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      contactService.updateContact(db, user!.id, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      triggerSync();
    },
  });
}

export function useArchiveContact() {
  const { db } = useDatabase();
  const { user } = useAuth();
  const { triggerSync } = useSync();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contactService.archiveContact(db, user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      triggerSync();
    },
  });
}
