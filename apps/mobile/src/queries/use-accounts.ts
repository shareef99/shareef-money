import { useQuery } from "@tanstack/react-query";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";
import * as accountService from "../services/account-service";

export const accountKeys = {
  all: ["accounts"] as const,
  list: (userId?: string) => [...accountKeys.all, "list", userId] as const,
};

export function useAccounts() {
  const { db } = useDatabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: accountKeys.list(user?.id),
    queryFn: () => accountService.getAccounts(db, user!.id),
    enabled: !!user,
    initialData: [],
  });
}
