// Date-range math for the stats period selector (week / month / year), kept
// framework-free so it's trivial to test and reuse.

export type Period = "weekly" | "monthly" | "annually";

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date, weekStartMonday: boolean): Date {
  const x = startOfDay(d);
  const dow = x.getDay();
  const offset = weekStartMonday ? (dow + 6) % 7 : dow;
  x.setDate(x.getDate() - offset);
  return x;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// The range for `period` containing `anchor`, respecting the week-start setting.
export function periodRange(
  period: Period,
  anchor: Date,
  weekStartMonday: boolean,
): DateRange {
  if (period === "weekly") {
    const from = startOfWeek(anchor, weekStartMonday);
    const to = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6));
    const sameMonth = from.getMonth() === to.getMonth();
    const label = sameMonth
      ? `${from.getDate()}–${to.getDate()} ${MONTHS[from.getMonth()]} ${from.getFullYear()}`
      : `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]}`;
    return { from, to, label };
  }
  if (period === "monthly") {
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const to = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
    return {
      from,
      to,
      label: from.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
  const from = new Date(anchor.getFullYear(), 0, 1);
  const to = endOfDay(new Date(anchor.getFullYear(), 11, 31));
  return { from, to, label: String(anchor.getFullYear()) };
}

// A new anchor shifted by `delta` periods (used by the prev/next chevrons).
export function shiftPeriod(period: Period, anchor: Date, delta: number): Date {
  if (period === "weekly") {
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + delta * 7);
  }
  if (period === "monthly") {
    return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
  }
  return new Date(anchor.getFullYear() + delta, anchor.getMonth(), 1);
}

// The range immediately before `range` (for period-over-period comparison).
export function previousRange(
  period: Period,
  anchor: Date,
  weekStartMonday: boolean,
): DateRange {
  return periodRange(period, shiftPeriod(period, anchor, -1), weekStartMonday);
}

// "YYYY-MM" key for the month containing `d` (budgets are keyed this way).
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
