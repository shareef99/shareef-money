import type {
  StatsTxn,
  StatsTypeKey,
  NetWorthTxn,
  DebtLedgerTxn,
  DebtTrendTxn,
} from "@shareef-money/shared/calc";
import type { Account, Category, Location, Transaction } from "./types";

type Lookups = {
  accounts: Account[];
  categories: Category[];
  locations: Location[];
};

// Resolve a category to its top-level ancestor by walking parentId. Cached per
// id so repeated lookups across many rows stay cheap.
function buildCategoryIndex(categories: Category[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const rootCache = new Map<number, Category | undefined>();
  const root = (id: number): Category | undefined => {
    if (rootCache.has(id)) return rootCache.get(id);
    let cur = byId.get(id);
    const seen = new Set<number>();
    while (cur && cur.parentId != null && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = byId.get(cur.parentId);
      if (!parent) break;
      cur = parent;
    }
    rootCache.set(id, cur);
    return cur;
  };
  return { byId, root };
}

// Comma-joined contact ids (from the list group_concat) → number[].
export function parseContactIds(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

// Enrich REST transactions into the shared StatsTxn shape (names/colors/root
// category resolved client-side). Only income/expense/transfer participate in
// the stats derivations — debts are handled separately (net worth, debt trend).
export function toStatsTxns(txns: Transaction[], lookups: Lookups): StatsTxn[] {
  const accountById = new Map(lookups.accounts.map((a) => [a.id, a]));
  const locationById = new Map(lookups.locations.map((l) => [l.id, l]));
  const { byId: categoryById, root } = buildCategoryIndex(lookups.categories);

  const out: StatsTxn[] = [];
  for (const t of txns) {
    if (t.type !== "income" && t.type !== "expense" && t.type !== "transfer") {
      continue;
    }
    const cat = t.categoryId != null ? categoryById.get(t.categoryId) : undefined;
    const rootCat = t.categoryId != null ? root(t.categoryId) : undefined;
    const acc = accountById.get(t.accountId);
    const toAcc = t.toAccountId != null ? accountById.get(t.toAccountId) : undefined;
    const loc = t.locationId != null ? locationById.get(t.locationId) : undefined;

    out.push({
      id: t.id,
      type: t.type as StatsTypeKey,
      amount: t.amount,
      fee: t.fee,
      date: new Date(t.date),
      categoryId: t.categoryId,
      categoryName: cat?.name ?? t.categoryName ?? null,
      categoryColor: cat?.color ?? t.categoryColor ?? null,
      rootId: rootCat?.id ?? t.categoryId,
      rootName: rootCat?.name ?? t.categoryName ?? null,
      rootColor: rootCat?.color ?? t.categoryColor ?? null,
      accountId: t.accountId,
      accountName: acc?.name ?? t.accountName ?? null,
      accountColor: acc?.color ?? null,
      toAccountId: t.toAccountId,
      toAccountName: toAcc?.name ?? null,
      locationId: t.locationId,
      locationName: loc?.name ?? null,
      contactIds: parseContactIds(t.contactIds),
      note: t.note,
    });
  }
  return out;
}

// All transactions as net-worth deltas (debts/transfers included — they net to
// zero except for fees, which netWorthDelta handles).
export function toNetWorthTxns(txns: Transaction[]): NetWorthTxn[] {
  return txns.map((t) => ({
    type: t.type,
    amount: t.amount,
    fee: t.fee,
    date: new Date(t.date),
  }));
}

const isDebt = (t: Transaction): t is Transaction & { type: "debt_lend" | "debt_borrow" } =>
  t.type === "debt_lend" || t.type === "debt_borrow";

// Debt events for the per-person ledger, with contact names resolved.
export function toDebtLedgerTxns(
  txns: Transaction[],
  contactNames: Map<number, string>,
): DebtLedgerTxn[] {
  return txns.filter(isDebt).map((t) => ({
    type: t.type,
    amount: t.amount,
    contactId: t.contactId,
    dueDate: t.dueDate ? new Date(t.dueDate) : null,
    contactName: t.contactId != null ? (contactNames.get(t.contactId) ?? null) : null,
  }));
}

// Debt events for the receivable/payable trend.
export function toDebtTrendTxns(txns: Transaction[]): DebtTrendTxn[] {
  return txns.filter(isDebt).map((t) => ({
    type: t.type,
    amount: t.amount,
    contactId: t.contactId,
    date: new Date(t.date),
  }));
}
