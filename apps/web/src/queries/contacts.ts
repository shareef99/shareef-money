import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ContactCreateInput,
  ContactUpdateInput,
} from "@shareef-money/shared/validation";
import { api } from "../lib/api";
import type { Contact } from "../lib/types";

export const contactKeys = {
  all: ["contacts"] as const,
  list: () => [...contactKeys.all, "list"] as const,
} as const;

export const getContacts = () =>
  queryOptions({
    queryKey: contactKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Contact[]>("/api/contacts");
      return data;
    },
  });

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactCreateInput) => {
      const { data } = await api.post<Contact>("/api/contacts", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ContactUpdateInput }) => {
      const { data } = await api.patch<Contact>(`/api/contacts/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
};

export const useArchiveContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/contacts/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
};
