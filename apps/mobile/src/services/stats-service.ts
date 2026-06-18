// Stats data layer for mobile. The pure derivations live in
// @shareef-money/shared/calc (shared with web); this module fetches enriched
// rows from the local DB (synchronous expo-sqlite reads) and re-exports the
// shared derives so screen/chart components keep importing them from here.
import { and, eq, gte, lte, lt, inArray, or, like, desc, isNull } from "drizzle-orm";
import {
  transactionsTable,
  transactionContactsTable,
  categoriesTable,
  accountsTable,
  locationsTable,
} from "@shareef-money/db/schema";
import {
  summarize,
  breakdownBy,
  filterByType,
  timeSeries,
  stackedByCategory,
  flow,
  dailyTotals,
  transferMatrix,
  autoBucket,
  openingBalance,
  cashFlow as cashFlowFromRows,
  netWorthSeries as netWorthSeriesFromRows,
  debtTrend as debtTrendFromRows,
  type StatsTxn,
  type StatsTypeKey,
  type TimeBucket,
  type CashFlow,
  type NetWorthPoint,
  type DebtTrendPoint,
} from "@shareef-money/shared/calc";
import type { Db } from "../db/client";
import type { StatsFilter } from "../lib/stats-filter";

// Re-export the pure derives + types so existing imports from this module work.
export {
  summarize,
  breakdownBy,
  filterByType,
  timeSeries,
  stackedByCategory,
  flow,
  dailyTotals,
  transferMatrix,
  autoBucket,
};
export type {
  StatsTxn,
  StatsSummary,
  BreakdownRow,
  BreakdownDimension,
  TimeBucket,
  TimePoint,
  SankeyNode,
  SankeyLink,
  StackSeries,
  TransferEdge,
  CashFlow,
  NetWorthPoint,
  DebtTrendPoint,
} from "@shareef-money/shared/calc";

type CatRow = {
  id: number;
  name: string;
  color: string | null;
  parentId: number | null;
};

// Resolve the top-level ancestor category (walks parent links defensively).
function resolveRoot(
  catId: number | null,
  cats: Map<number, CatRow>,
): CatRow | null {
  if (catId == null) return null;
  let cur = cats.get(catId);
  let guard = 0;
  while (cur && cur.parentId != null && cats.has(cur.parentId) && guard < 10) {
    cur = cats.get(cur.parentId);
    guard += 1;
  }
  return cur ?? null;
}

// Expand selected category ids to also include their subcategories, so picking
// a parent category includes everything filed under it (drill-down filter).
function expandCategoryIds(ids: number[], cats: Map<number, CatRow>): number[] {
  if (!ids.length) return ids;
  const set = new Set(ids);
  for (const c of cats.values()) {
    if (c.parentId != null && set.has(c.parentId)) set.add(c.id);
  }
  return [...set];
}

// The one filtered, enriched read. Synchronous.
export function queryStatsTransactions(
  db: Db,
  userId: string,
  filter: StatsFilter,
): StatsTxn[] {
  const accountRows = db
    .select({
      id: accountsTable.id,
      name: accountsTable.name,
      color: accountsTable.color,
    })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .all();
  const accounts = new Map(accountRows.map((a) => [a.id, a]));

  const catRows = db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
      parentId: categoriesTable.parentId,
    })
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, userId))
    .all();
  const cats = new Map<number, CatRow>(catRows.map((c) => [c.id, c]));

  const locRows = db
    .select({ id: locationsTable.id, name: locationsTable.name })
    .from(locationsTable)
    .where(eq(locationsTable.userId, userId))
    .all();
  const locations = new Map(locRows.map((l) => [l.id, l]));

  const conditions = [
    eq(transactionsTable.userId, userId),
    isNull(transactionsTable.deletedAt),
    gte(transactionsTable.date, filter.from),
    lte(transactionsTable.date, filter.to),
  ];
  if (filter.types.length) {
    conditions.push(inArray(transactionsTable.type, filter.types));
  } else {
    // "All" means income/expense/transfer — debts are balance-sheet moves and
    // live in their own Debts card/tab, never in the income/expense charts.
    conditions.push(
      inArray(transactionsTable.type, ["income", "expense", "transfer"]),
    );
  }
  if (filter.accountIds.length) {
    const a = or(
      inArray(transactionsTable.accountId, filter.accountIds),
      inArray(transactionsTable.toAccountId, filter.accountIds),
    );
    if (a) conditions.push(a);
  }
  if (filter.categoryIds.length) {
    conditions.push(
      inArray(transactionsTable.categoryId, expandCategoryIds(filter.categoryIds, cats)),
    );
  }
  if (filter.locationIds.length) {
    conditions.push(inArray(transactionsTable.locationId, filter.locationIds));
  }
  if (filter.amountMin != null) {
    conditions.push(gte(transactionsTable.amount, filter.amountMin));
  }
  if (filter.amountMax != null) {
    conditions.push(lte(transactionsTable.amount, filter.amountMax));
  }
  if (filter.search.trim()) {
    conditions.push(like(transactionsTable.note, `%${filter.search.trim()}%`));
  }

  const rows = db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
      date: transactionsTable.date,
      categoryId: transactionsTable.categoryId,
      accountId: transactionsTable.accountId,
      toAccountId: transactionsTable.toAccountId,
      locationId: transactionsTable.locationId,
      note: transactionsTable.note,
    })
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.date))
    .all();

  // Attach contact ids for the matched rows (and apply the people filter).
  const ids = rows.map((r) => r.id);
  const contactsByTxn = new Map<number, number[]>();
  if (ids.length) {
    const links = db
      .select({
        transactionId: transactionContactsTable.transactionId,
        contactId: transactionContactsTable.contactId,
      })
      .from(transactionContactsTable)
      .where(inArray(transactionContactsTable.transactionId, ids))
      .all();
    for (const link of links) {
      const list = contactsByTxn.get(link.transactionId);
      if (list) list.push(link.contactId);
      else contactsByTxn.set(link.transactionId, [link.contactId]);
    }
  }

  const contactFilter = filter.contactIds.length ? new Set(filter.contactIds) : null;

  const result: StatsTxn[] = [];
  for (const r of rows) {
    const contactIds = contactsByTxn.get(r.id) ?? [];
    if (contactFilter && !contactIds.some((id) => contactFilter.has(id))) continue;

    const cat = r.categoryId != null ? cats.get(r.categoryId) : undefined;
    const root = resolveRoot(r.categoryId, cats);
    const acc = accounts.get(r.accountId);
    const toAcc = r.toAccountId != null ? accounts.get(r.toAccountId) : undefined;
    const loc = r.locationId != null ? locations.get(r.locationId) : undefined;

    result.push({
      id: r.id,
      type: r.type as StatsTypeKey,
      amount: r.amount,
      fee: r.fee,
      date: r.date instanceof Date ? r.date : new Date(r.date as number),
      categoryId: r.categoryId,
      categoryName: cat?.name ?? null,
      categoryColor: cat?.color ?? null,
      rootId: root?.id ?? null,
      rootName: root?.name ?? null,
      rootColor: root?.color ?? null,
      accountId: r.accountId,
      accountName: acc?.name ?? null,
      accountColor: acc?.color ?? null,
      toAccountId: r.toAccountId,
      toAccountName: toAcc?.name ?? null,
      locationId: r.locationId,
      locationName: loc?.name ?? null,
      contactIds,
      note: r.note,
    });
  }
  return result;
}

// ---- db wrappers that fetch rows then delegate to the shared calc ----

// True net worth just before `before`: account initial balances plus the
// running effect of every earlier (non-deleted) transaction.
function openingNetWorth(db: Db, userId: string, before: Date): number {
  const accs = db
    .select({ initialBalance: accountsTable.initialBalance })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .all();
  const initialTotal = accs.reduce((s, a) => s + a.initialBalance, 0);

  const prior = db
    .select({
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
      date: transactionsTable.date,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        isNull(transactionsTable.deletedAt),
        lt(transactionsTable.date, before),
      ),
    )
    .all();

  return openingBalance(initialTotal, prior);
}

function rangeNetWorthTxns(db: Db, userId: string, from: Date, to: Date) {
  return db
    .select({
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
      date: transactionsTable.date,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        isNull(transactionsTable.deletedAt),
        gte(transactionsTable.date, from),
        lte(transactionsTable.date, to),
      ),
    )
    .all();
}

// Whole-portfolio cash flow across [from,to] (drives the waterfall).
export function cashFlow(db: Db, userId: string, from: Date, to: Date): CashFlow {
  const opening = openingNetWorth(db, userId, from);
  return cashFlowFromRows(opening, rangeNetWorthTxns(db, userId, from, to));
}

// Cumulative net worth per bucket across [from,to].
export function netWorthSeries(
  db: Db,
  userId: string,
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): NetWorthPoint[] {
  const opening = openingNetWorth(db, userId, from);
  return netWorthSeriesFromRows(
    opening,
    rangeNetWorthTxns(db, userId, from, to),
    from,
    to,
    bucket,
    weekStartMonday,
  );
}

// Receivable/payable position per bucket across [from,to].
export function debtTrend(
  db: Db,
  userId: string,
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): DebtTrendPoint[] {
  const txns = db
    .select({
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      contactId: transactionsTable.contactId,
      date: transactionsTable.date,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        isNull(transactionsTable.deletedAt),
        inArray(transactionsTable.type, ["debt_lend", "debt_borrow"]),
        lte(transactionsTable.date, to),
      ),
    )
    .all();

  return debtTrendFromRows(
    txns.map((r) => ({
      type: r.type as "debt_lend" | "debt_borrow",
      amount: r.amount,
      contactId: r.contactId,
      date: r.date instanceof Date ? r.date : new Date(r.date as number),
    })),
    from,
    to,
    bucket,
    weekStartMonday,
  );
}
