import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { UserProfile } from "@shareef-money/shared/validation";
import { api } from "../lib/api";

export const authKeys = {
  me: ["auth", "me"] as const,
} as const;

export const getMe = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const { data } = await api.get<UserProfile>("/auth/me");
        return data;
      } catch (_e) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await api.post("/auth/login", data);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
    }) => {
      await api.post("/auth/register", data);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
    },
  });
};
