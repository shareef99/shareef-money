import type { TransactionType } from "../types";
import { type TimeBucket, bucketKey, bucketKeys, bucketLabel } from "./stats";

export type NetWorthTxn = {
  type: TransactionType;
  amount: number;
  fee: number;
  date: Date;
};

// Per-transaction effect on net worth. Debts cancel out (cash converts to a
// receivable/payable of equal value), so they contribute only their fee (0);
// transfers net to zero across accounts except for the fee.
export function netWorthDelta(t: {
  type: TransactionType;
  amount: number;
  fee: number;
}): number {
  if (t.type === "income") return t.amount;
  if (t.type === "expense") return -t.amount;
  return -t.fee;
}

// True net worth just before the range: sum of account initial balances plus
// the running effect of every earlier transaction.
export function openingBalance(initialTotal: number, priorTxns: NetWorthTxn[]): number {
  let total = initialTotal;
  for (const t of priorTxns) total += netWorthDelta(t);
  return total;
}

export type CashFlow = {
  opening: number;
  income: number;
  expense: number;
  fees: number;
  closing: number;
};

export function cashFlow(opening: number, rangeTxns: NetWorthTxn[]): CashFlow {
  let income = 0;
  let expense = 0;
  let fees = 0;
  for (const t of rangeTxns) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
    else fees += t.fee;
  }
  return { opening, income, expense, fees, closing: opening + income - expense - fees };
}

export type NetWorthPoint = { key: string; label: string; value: number };

// Cumulative net worth at the end of each bucket across [from,to]. `rangeTxns`
// are the transactions within the range; `opening` is the net worth just before it.
export function netWorthSeries(
  opening: number,
  rangeTxns: NetWorthTxn[],
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): NetWorthPoint[] {
  const delta = new Map<string, number>();
  for (const k of bucketKeys(from, to, bucket, weekStartMonday)) delta.set(k, 0);

  for (const t of rangeTxns) {
    const key = bucketKey(t.date, bucket, weekStartMonday);
    delta.set(key, (delta.get(key) ?? 0) + netWorthDelta(t));
  }

  const order = [...delta.keys()].sort((a, b) => a.localeCompare(b));
  let running = opening;
  return order.map((key) => {
    running += delta.get(key) ?? 0;
    return { key, label: bucketLabel(key, bucket), value: running };
  });
}
