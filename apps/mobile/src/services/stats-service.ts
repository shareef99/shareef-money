// Stats data layer. Reads are synchronous (expo-sqlite getAllSync via drizzle's
// .all()), so a query resolves in-tick and React Query's keepPreviousData +
// prefetch make period changes instant. One filtered read returns enriched
// rows; the pure derive functions below compute every chart's data from them.
import { and, eq, gte, lte, inArray, or, like, desc } from "drizzle-orm";
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
    else transfer += t.amount;
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
