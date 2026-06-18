import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { accountKeys } from "./accounts";
import { categoryKeys } from "./categories";
import { transactionKeys } from "./transactions";
import type { Category } from "../lib/types";

// Writing off a receivable (someone who owed you, but you accept you won't be
// repaid): settle the ledger with an opposite debt entry AND book the loss as
// an expense so net worth drops. Mirrors the mobile writeOffDebt flow. Net cash
// change is zero; net worth falls by `amount`.
export const useWriteOffDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      amount,
      accountId,
    }: {
      contactId: number;
      amount: number;
      accountId: number;
    }) => {
      const categories = queryClient.getQueryData<Category[]>(categoryKeys.list()) ?? [];
      let badDebt = categories.find(
        (c) => c.type === "expense" && c.name.toLowerCase() === "bad debt",
      );
      if (!badDebt) {
        const { data } = await api.post<Category>("/api/categories", {
          name: "Bad Debt",
          type: "expense",
        });
        badDebt = data;
      }

      const now = Date.now();
      // Settle the per-person ledger back to zero.
      await api.post("/api/transactions", {
        type: "debt_borrow",
        amount,
        date: now,
        accountId,
        contactId,
        note: "Write-off",
      });
      // Record the loss against net worth.
      await api.post("/api/transactions", {
        type: "expense",
        amount,
        date: now,
        accountId,
        categoryId: badDebt.id,
        note: "Bad debt write-off",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};
