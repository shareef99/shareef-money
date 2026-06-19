// Pure stats derivations shared by mobile and web. Every function operates on
// already-fetched, enriched rows (StatsTxn) — no db/network dependency — so both
// apps fetch their own way (local SQLite vs REST) and call these.

export type StatsTypeKey = "income" | "expense" | "transfer";

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

export function bucketKey(date: Date, bucket: TimeBucket, weekStartMonday: boolean): string {
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

export function bucketLabel(key: string, bucket: TimeBucket): string {
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

// Ordered list of bucket keys spanning [from,to] (inclusive of empty buckets).
export function bucketKeys(
  from: Date,
  to: Date,
  bucket: TimeBucket,
  weekStartMonday: boolean,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cursor <= to && guard < 1000) {
    keys.push(bucketKey(cursor, bucket, weekStartMonday));
    if (bucket === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return keys;
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

  for (const key of bucketKeys(from, to, bucket, weekStartMonday)) ensure(key);

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

export type SankeyNode = {
  id: string;
  name: string;
  color: string | null;
  column: 0 | 1 | 2;
  value: number;
};
export type SankeyLink = { source: string; target: string; value: number };

// Sankey edges: income category -> account -> expense category.
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
      const cat = node(`inc:${t.rootId ?? "none"}`, t.rootName ?? "Income", t.rootColor, 0);
      const acc = node(`acc:${t.accountId}`, t.accountName ?? "Account", t.accountColor, 1);
      cat.value += t.amount;
      acc.value += t.amount;
      link(cat.id, acc.id, t.amount);
    } else if (t.type === "expense") {
      const acc = node(`acc:${t.accountId}`, t.accountName ?? "Account", t.accountColor, 1);
      const cat = node(`exp:${t.rootId ?? "none"}`, t.rootName ?? "Expense", t.rootColor, 2);
      acc.value += t.amount;
      cat.value += t.amount;
      link(acc.id, cat.id, t.amount);
    }
  }

  return { nodes: [...nodes.values()], links: [...links.values()] };
}

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

  const keys = bucketKeys(from, to, bucket, weekStartMonday);
  const labels = keys.map((k) => bucketLabel(k, bucket));
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
