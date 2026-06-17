// The single filter object that drives every Stats query and chart. Held in a
// StatsFilterProvider local to the Stats screen so the filter bar, sheet, and
// all charts share one source of truth.
import {
  getMonthRange,
  monthRangeLabel,
  startOfWeek,
  type WeekStart,
} from "./period";

export type StatsTypeKey = "income" | "expense" | "transfer";
export type StatsPeriod = "week" | "month" | "year" | "custom";

export type StatsFilter = {
  period: StatsPeriod;
  // Reference date used to derive week/month/year ranges and to navigate.
  anchor: Date;
  from: Date;
  to: Date;
  // Empty arrays mean "all". Accounts default to all non-hidden.
  types: StatsTypeKey[];
  accountIds: number[];
  categoryIds: number[];
  locationIds: number[];
  contactIds: number[];
  amountMin: number | null;
  amountMax: number | null;
  search: string;
};

export type RangeOpts = { monthStartDay: number; weekStart: WeekStart };

const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const fmtDayYear = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// from/to (and a human label) for a non-custom period anchored at `anchor`.
export function rangeFor(
  period: Exclude<StatsPeriod, "custom">,
  anchor: Date,
  opts: RangeOpts,
): { from: Date; to: Date; label: string } {
  if (period === "week") {
    const from = startOfWeek(anchor, opts.weekStart);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to, label: `${fmtDay(from)} – ${fmtDay(to)}` };
  }
  if (period === "year") {
    const from = new Date(anchor.getFullYear(), 0, 1, 0, 0, 0, 0);
    const to = new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { from, to, label: String(anchor.getFullYear()) };
  }
  const { start, end } = getMonthRange(anchor, opts.monthStartDay);
  return { from: start, to: end, label: monthRangeLabel(anchor, opts.monthStartDay) };
}

export function makeDefaultFilter(opts: RangeOpts): StatsFilter {
  const anchor = new Date();
  const { from, to } = rangeFor("month", anchor, opts);
  return {
    period: "month",
    anchor,
    from,
    to,
    types: [],
    accountIds: [],
    categoryIds: [],
    locationIds: [],
    contactIds: [],
    amountMin: null,
    amountMax: null,
    search: "",
  };
}

// Switch period kind, recomputing from/to off the current anchor.
export function withPeriod(
  filter: StatsFilter,
  period: StatsPeriod,
  opts: RangeOpts,
): StatsFilter {
  if (period === "custom") return { ...filter, period };
  const { from, to } = rangeFor(period, filter.anchor, opts);
  return { ...filter, period, from, to };
}

// Move the anchor one period in `dir` (−1 prev, +1 next) and recompute range.
export function navigatePeriod(
  filter: StatsFilter,
  dir: -1 | 1,
  opts: RangeOpts,
): StatsFilter {
  if (filter.period === "custom") return filter;
  const anchor = new Date(filter.anchor);
  if (filter.period === "week") anchor.setDate(anchor.getDate() + dir * 7);
  else if (filter.period === "year") anchor.setFullYear(anchor.getFullYear() + dir);
  else anchor.setMonth(anchor.getMonth() + dir);
  const { from, to } = rangeFor(filter.period, anchor, opts);
  return { ...filter, anchor, from, to };
}

export function withCustomRange(filter: StatsFilter, from: Date, to: Date): StatsFilter {
  const lo = from <= to ? from : to;
  const hi = from <= to ? to : from;
  const start = new Date(lo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(hi);
  end.setHours(23, 59, 59, 999);
  return { ...filter, period: "custom", from: start, to: end };
}

export function periodLabel(filter: StatsFilter, opts: RangeOpts): string {
  if (filter.period === "custom") {
    return `${fmtDayYear(filter.from)} – ${fmtDayYear(filter.to)}`;
  }
  return rangeFor(filter.period, filter.anchor, opts).label;
}

// How many non-period filters are active (drives the filter-bar badge).
export function activeFilterCount(filter: StatsFilter): number {
  let n = 0;
  if (filter.types.length) n += 1;
  if (filter.accountIds.length) n += 1;
  if (filter.categoryIds.length) n += 1;
  if (filter.locationIds.length) n += 1;
  if (filter.contactIds.length) n += 1;
  if (filter.amountMin != null || filter.amountMax != null) n += 1;
  if (filter.search.trim()) n += 1;
  return n;
}

export function clearFilters(filter: StatsFilter): StatsFilter {
  return {
    ...filter,
    types: [],
    accountIds: [],
    categoryIds: [],
    locationIds: [],
    contactIds: [],
    amountMin: null,
    amountMax: null,
    search: "",
  };
}

// Persistable form of a filter (Dates -> epoch millis) for saved views.
export type StoredFilter = Omit<StatsFilter, "from" | "to" | "anchor"> & {
  from: number;
  to: number;
  anchor: number;
};

export function toStored(f: StatsFilter): StoredFilter {
  return { ...f, from: f.from.getTime(), to: f.to.getTime(), anchor: f.anchor.getTime() };
}

export function fromStored(s: StoredFilter): StatsFilter {
  return {
    period: s.period,
    anchor: new Date(s.anchor),
    from: new Date(s.from),
    to: new Date(s.to),
    types: s.types ?? [],
    accountIds: s.accountIds ?? [],
    categoryIds: s.categoryIds ?? [],
    locationIds: s.locationIds ?? [],
    contactIds: s.contactIds ?? [],
    amountMin: s.amountMin ?? null,
    amountMax: s.amountMax ?? null,
    search: s.search ?? "",
  };
}

// Stable string for the React Query key — same filter => same key => cache hit.
export function serializeFilter(filter: StatsFilter): string {
  return JSON.stringify({
    f: filter.from.getTime(),
    t: filter.to.getTime(),
    ty: [...filter.types].sort(),
    a: [...filter.accountIds].sort((x, y) => x - y),
    c: [...filter.categoryIds].sort((x, y) => x - y),
    l: [...filter.locationIds].sort((x, y) => x - y),
    p: [...filter.contactIds].sort((x, y) => x - y),
    mn: filter.amountMin,
    mx: filter.amountMax,
    s: filter.search.trim().toLowerCase(),
  });
}
