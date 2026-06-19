import type { TransactionType } from "../types";

export type BalanceAccount = {
  id: number;
  initialBalance: number;
  isHidden?: boolean;
};

export type BalanceTxn = {
  type: TransactionType;
  amount: number;
  fee: number;
  accountId: number | null;
  toAccountId: number | null;
};

// Balance per account = initialBalance + incomes − expenses + transfers in −
// (transfers out + fees) − debts lent + debts borrowed. `total` excludes hidden
// accounts. Deleted transactions must be filtered out by the caller.
export function computeAccountBalances(
  accounts: BalanceAccount[],
  txns: BalanceTxn[],
): { balances: Record<number, number>; total: number } {
  const delta = new Map<number, number>();
  const add = (id: number | null, value: number) => {
    if (id == null) return;
    delta.set(id, (delta.get(id) ?? 0) + value);
  };

  for (const t of txns) {
    if (t.type === "income") add(t.accountId, t.amount);
    else if (t.type === "expense") add(t.accountId, -t.amount);
    else if (t.type === "transfer") {
      add(t.accountId, -(t.amount + t.fee));
      add(t.toAccountId, t.amount);
    } else if (t.type === "debt_lend") add(t.accountId, -t.amount);
    else if (t.type === "debt_borrow") add(t.accountId, t.amount);
  }

  const balances: Record<number, number> = {};
  let total = 0;
  for (const a of accounts) {
    const bal = a.initialBalance + (delta.get(a.id) ?? 0);
    balances[a.id] = bal;
    if (!a.isHidden) total += bal;
  }
  return { balances, total };
}
