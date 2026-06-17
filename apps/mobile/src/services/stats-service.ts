// Stats data layer. Reads are synchronous (expo-sqlite getAllSync via drizzle's
// .all()), so a query resolves in-tick and React Query's keepPreviousData +
// prefetch make period changes instant. One filtered read returns enriched
// rows; the pure derive functions below compute every chart's data from them.
import { and, eq, gte, lte, lt, inArray, or, like, desc } from "drizzle-orm";
import {
  transactionsTable,
  transactionContactsTable,
  categoriesTable,
  accountsTable,
  locationsTable,
} from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import type { StatsFilter, StatsTypeKey } from "../lib/stats-filter";

export type StatsTxn = {
  id: number;
  type: StatsTypeKey;
  amount: number;
  fee: number;
  date: Date;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  // Top-level ancestor of the category (the category itself if it has no parent).
  rootId: number | null;
  rootName: string | null;
  rootColor: string | null;
  accountId: number;
  accountName: string | null;
  accountColor: string | null;
  toAccountId: number | null;
  toAccountName: string | null;
  locationId: number | null;
  locationName: string | null;
  contactIds: number[];
  note: string | null;
};

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

// ---- pure derive helpers (operate on already-fetched rows) ----

export type StatsSummary = {
  income: number;
  expense: number;
  transfer: number;
  fees: number;
  net: number;
  count: number;
  savingsRate: number; // net / income, 0..1 (0 if no income)
};

export function summarize(txns: StatsTxn[]): StatsSummary {
  let income = 0;
  let expense = 0;
  let transfer = 0;
  let fees = 0;
  for (const t of txns) {
    fees += t.fee;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
    else if (t.type === "transfer") transfer += t.amount;
  }
  const net = income - expense;
  return {
    income,
    expense,
    transfer,
    fees,
    net,
    count: txns.length,
    savingsRate: income > 0 ? net / income : 0,
  };
}

export type BreakdownRow = {
  key: string;
  id: number | null;
  name: string;
  color: string | null;
  total: number;
  count: number;
  pct: number;
};

export type BreakdownDimension =
  | "category"
  | "subcategory"
  | "account"
  | "location"
  | "person"
  | "dayOfWeek";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function filterByType(txns: StatsTxn[], type: StatsTypeKey): StatsTxn[] {
  return txns.filter((t) => t.type === type);
}

// Group rows by a dimension and rank by total descending. `contactNames` is
// needed only for the "person" dimension.
export function breakdownBy(
  txns: StatsTxn[],
  dimension: BreakdownDimension,
  contactNames?: Map<number, string>,
): { rows: BreakdownRow[]; total: number } {
  const groups = new Map<string, BreakdownRow>();
  let total = 0;

  const add = (
    key: string,
    id: number | null,
    name: string,
    color: string | null,
    amount: number,
  ) => {
    total += amount;
    const existing = groups.get(key);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      groups.set(key, { key, id, name, color, total: amount, count: 1, pct: 0 });
    }
  };

  for (const t of txns) {
    if (dimension === "person") {
      // A txn with multiple people contributes its amount to each.
      if (!t.contactIds.length) {
        add("none", null, "No one", null, t.amount);
      } else {
        for (const cid of t.contactIds) {
          add(`p${cid}`, cid, contactNames?.get(cid) ?? "Unknown", null, t.amount);
        }
      }
      continue;
    }
    if (dimension === "category") {
      add(
        t.rootId != null ? `c${t.rootId}` : "none",
        t.rootId,
        t.rootName ?? "Uncategorized",
        t.rootColor,
        t.amount,
      );
    } else if (dimension === "subcategory") {
      add(
        t.categoryId != null ? `s${t.categoryId}` : "none",
        t.categoryId,
        t.categoryName ?? "Uncategorized",
        t.categoryColor,
        t.amount,
      );
    } else if (dimension === "account") {
      add(`a${t.accountId}`, t.accountId, t.accountName ?? "Account", t.accountColor, t.amount);
    } else if (dimension === "location") {
      add(
        t.locationId != null ? `l${t.locationId}` : "none",
        t.locationId,
        t.locationName ?? "No location",
        null,
        t.amount,
      );
    } else if (dimension === "dayOfWeek") {
      const d = t.date.getDay();
      add(`d${d}`, d, DOW[d]!, null, t.amount);
    }
  }

  const rows = [...groups.values()].sort((a, b) => b.total - a.total);
  for (const r of rows) r.pct = total > 0 ? (r.total / total) * 100 : 0;
  return { rows, total };
}

export type TimeBucket = "day" | "week" | "month";
export type TimePoint = { key: string; label: string; income: number; expense: number; net: number };

function bucketKey(date: Date, bucket: TimeBucket, weekStartMonday: boolean): string {
  if (bucket === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (bucket === "week") {
    const d = new Date(date);
    const dow = d.getDay();
    const offset = weekStartMonday ? (dow + 6) % 7 : dow;
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function bucketLabel(key: string, bucket: TimeBucket): string {
  if (bucket === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y!, m! - 1, 1).toLocaleDateString("en-US", { month: "short" });
  }
  const [y, m, d] = key.split("-").map(Number);
  if (bucket === "week") {
    return new Date(y!, m! - 1, d!).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }
  return String(d);
}

// Pick a sensible bucket size for a date span.
export function autoBucket(from: Date, to: Date): TimeBucket {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days <= 35) return "day";
  if (days <= 200) return "week";
  return "month";
}

// Income/expense/net per time bucket across [from,to] (empty buckets included).
export function timeSeries(
  txns: StatsTxn[],
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): TimePoint[] {
  const map = new Map<string, TimePoint>();
  const ensure = (key: string) => {
    let p = map.get(key);
    if (!p) {
      p = { key, label: bucketLabel(key, bucket), income: 0, expense: 0, net: 0 };
      map.set(key, p);
    }
    return p;
  };

  // Seed empty buckets so the axis is continuous.
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    ensure(bucketKey(cursor, bucket, weekStartMonday));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  for (const t of txns) {
    if (t.type === "transfer") continue;
    const p = ensure(bucketKey(t.date, bucket, weekStartMonday));
    if (t.type === "income") p.income += t.amount;
    else p.expense += t.amount;
  }

  const points = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const p of points) p.net = p.income - p.expense;
  return points;
}

// ---- Phase 2: money-flow aggregations ----

// Total net worth (all accounts) just before `before`. Opening balances are
// modelled as income transactions, so this is initialBalance (usually 0) plus
// the running effect of every earlier transaction; transfers net to zero across
// accounts except for their fee.
function balanceBefore(db: Db, userId: string, before: Date): number {
  const accs = db
    .select({ initialBalance: accountsTable.initialBalance })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .all();
  let total = accs.reduce((s, a) => s + a.initialBalance, 0);

  const txns = db
    .select({
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
    })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), lt(transactionsTable.date, before)))
    .all();
  for (const t of txns) {
    if (t.type === "income") total += t.amount;
    else if (t.type === "expense") total -= t.amount;
    else total -= t.fee;
  }
  return total;
}

export type CashFlow = {
  opening: number;
  income: number;
  expense: number;
  fees: number;
  closing: number;
};

// Whole-portfolio cash flow across the filter's date range (ignores account /
// category filters — net worth is global). Drives the waterfall.
export function cashFlow(db: Db, userId: string, from: Date, to: Date): CashFlow {
  const opening = balanceBefore(db, userId, from);
  const txns = db
    .select({
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      fee: transactionsTable.fee,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, from),
        lte(transactionsTable.date, to),
      ),
    )
    .all();
  let income = 0;
  let expense = 0;
  let fees = 0;
  for (const t of txns) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
    else fees += t.fee;
  }
  return { opening, income, expense, fees, closing: opening + income - expense - fees };
}

export type NetWorthPoint = { key: string; label: string; value: number };

// Cumulative net worth at the end of each bucket across [from,to].
export function netWorthSeries(
  db: Db,
  userId: string,
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): NetWorthPoint[] {
  const opening = balanceBefore(db, userId, from);
  const txns = db
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
        gte(transactionsTable.date, from),
        lte(transactionsTable.date, to),
      ),
    )
    .all();

  const delta = new Map<string, number>();
  const order: string[] = [];
  const ensure = (key: string) => {
    if (!delta.has(key)) {
      delta.set(key, 0);
      order.push(key);
    }
  };

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    ensure(bucketKey(cursor, bucket, weekStartMonday));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  for (const t of txns) {
    const d = t.date instanceof Date ? t.date : new Date(t.date as number);
    const key = bucketKey(d, bucket, weekStartMonday);
    ensure(key);
    const v = t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : -t.fee;
    delta.set(key, (delta.get(key) ?? 0) + v);
  }

  order.sort((a, b) => a.localeCompare(b));
  let running = opening;
  return order.map((key) => {
    running += delta.get(key) ?? 0;
    return { key, label: bucketLabel(key, bucket), value: running };
  });
}

export type DebtTrendPoint = {
  key: string;
  label: string;
  receivable: number; // total others owe you at the end of this bucket
  payable: number; // total you owe others
  net: number; // receivable − payable
};

// Receivable/payable position at the end of each bucket across [from,to].
// Debts are running per-person balances, so a snapshot at any point is the sum
// of every person's net (lend − borrow) up to that moment, split into the
// positive side (owed to you) and negative side (you owe). All debt history
// before `from` is folded into the opening snapshot.
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
        inArray(transactionsTable.type, ["debt_lend", "debt_borrow"]),
        lte(transactionsTable.date, to),
      ),
    )
    .orderBy(transactionsTable.date)
    .all();

  // Ordered bucket starts across the range (same scheme as the other series).
  const starts: Date[] = [];
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    starts.push(new Date(cursor));
    keys.push(bucketKey(cursor, bucket, weekStartMonday));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  const perContact = new Map<number, number>();
  const points: DebtTrendPoint[] = [];
  let ti = 0;

  for (let i = 0; i < starts.length; i += 1) {
    // Apply every txn dated before this bucket's end (= next bucket's start, or
    // just past `to` for the final bucket). Txns before `from` land here too,
    // so the first snapshot already reflects all prior history.
    const end = i + 1 < starts.length ? starts[i + 1]! : new Date(to.getTime() + 1);
    while (ti < txns.length) {
      const raw = txns[ti]!;
      const d = raw.date instanceof Date ? raw.date : new Date(raw.date as number);
      if (d >= end) break;
      if (raw.contactId != null) {
        const v = raw.type === "debt_lend" ? raw.amount : -raw.amount;
        perContact.set(raw.contactId, (perContact.get(raw.contactId) ?? 0) + v);
      }
      ti += 1;
    }

    let receivable = 0;
    let payable = 0;
    for (const net of perContact.values()) {
      if (net > 0) receivable += net;
      else if (net < 0) payable += -net;
    }
    points.push({
      key: keys[i]!,
      label: bucketLabel(keys[i]!, bucket),
      receivable,
      payable,
      net: receivable - payable,
    });
  }

  return points;
}

export type SankeyNode = {
  id: string;
  name: string;
  color: string | null;
  column: 0 | 1 | 2;
  value: number;
};
export type SankeyLink = { source: string; target: string; value: number };

// Sankey edges: income category -> account -> expense category. Transfers are
// shown separately (see transferMatrix).
export function flow(txns: StatsTxn[]): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const nodes = new Map<string, SankeyNode>();
  const links = new Map<string, SankeyLink>();

  const node = (id: string, name: string, color: string | null, column: 0 | 1 | 2) => {
    const existing = nodes.get(id);
    if (existing) return existing;
    const n: SankeyNode = { id, name, color, column, value: 0 };
    nodes.set(id, n);
    return n;
  };
  const link = (source: string, target: string, value: number) => {
    const key = `${source}->${target}`;
    const existing = links.get(key);
    if (existing) existing.value += value;
    else links.set(key, { source, target, value });
  };

  for (const t of txns) {
    if (t.type === "income") {
      const cat = node(
        `inc:${t.rootId ?? "none"}`,
        t.rootName ?? "Income",
        t.rootColor,
        0,
      );
      const acc = node(`acc:${t.accountId}`, t.accountName ?? "Account", t.accountColor, 1);
      cat.value += t.amount;
      acc.value += t.amount;
      link(cat.id, acc.id, t.amount);
    } else if (t.type === "expense") {
      const acc = node(`acc:${t.accountId}`, t.accountName ?? "Account", t.accountColor, 1);
      const cat = node(
        `exp:${t.rootId ?? "none"}`,
        t.rootName ?? "Expense",
        t.rootColor,
        2,
      );
      acc.value += t.amount;
      cat.value += t.amount;
      link(acc.id, cat.id, t.amount);
    }
  }

  return { nodes: [...nodes.values()], links: [...links.values()] };
}

// ---- Phase 3: depth aggregations ----

// Per-day totals for a type, keyed "YYYY-MM-DD" (drives the calendar heatmap).
export function dailyTotals(txns: StatsTxn[], type: StatsTypeKey): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== type) continue;
    const d = t.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return map;
}

export type StackSeries = { name: string; color: string | null; total: number; values: number[] };

// Top-N categories stacked per time bucket (the rest folded into "Other").
export function stackedByCategory(
  txns: StatsTxn[],
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
  type: StatsTypeKey = "expense",
  topN = 5,
): { labels: string[]; series: StackSeries[] } {
  const typed = txns.filter((t) => t.type === type);
  const totals = breakdownBy(typed, "category");
  const top = totals.rows.slice(0, topN);
  const topIds = new Set(top.map((r) => r.id));

  // Ordered bucket keys across the range.
  const keys: string[] = [];
  const labels: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    const k = bucketKey(cursor, bucket, weekStartMonday);
    keys.push(k);
    labels.push(bucketLabel(k, bucket));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  const idx = new Map(keys.map((k, i) => [k, i]));

  const series: StackSeries[] = top.map((r) => ({
    name: r.name,
    color: r.color,
    total: r.total,
    values: new Array(keys.length).fill(0),
  }));
  const seriesByCat = new Map(top.map((r, i) => [r.id, series[i]!]));
  const other: StackSeries = {
    name: "Other",
    color: null,
    total: 0,
    values: new Array(keys.length).fill(0),
  };

  for (const t of typed) {
    const i = idx.get(bucketKey(t.date, bucket, weekStartMonday));
    if (i == null) continue;
    const s = topIds.has(t.rootId) ? seriesByCat.get(t.rootId) : other;
    if (!s) continue;
    s.values[i] = (s.values[i] ?? 0) + t.amount;
    if (s === other) other.total += t.amount;
  }

  return { labels, series: other.total > 0 ? [...series, other] : series };
}

export type TransferEdge = {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  total: number;
  count: number;
};

// Account -> account transfer totals.
export function transferMatrix(txns: StatsTxn[]): TransferEdge[] {
  const map = new Map<string, TransferEdge>();
  for (const t of txns) {
    if (t.type !== "transfer" || t.toAccountId == null) continue;
    const key = `${t.accountId}->${t.toAccountId}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      map.set(key, {
        fromId: t.accountId,
        toId: t.toAccountId,
        fromName: t.accountName ?? "Account",
        toName: t.toAccountName ?? "Account",
        total: t.amount,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
