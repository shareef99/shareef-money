// Date-range helpers that respect the user's configurable financial-month
// start day and week start day.

export type WeekStart = "sunday" | "monday";

// The financial-month range whose cycle contains `date`. With startDay = 1 this
// is just the calendar month; with e.g. 25 it spans the 25th to the 24th.
export function getMonthRange(
  date: Date,
  startDay: number,
): { start: Date; end: Date } {
  const year = date.getFullYear();
  let month = date.getMonth();
  // Days before the start day belong to the cycle that began the prior month.
  if (startDay > 1 && date.getDate() < startDay) {
    month -= 1;
  }
  const start = new Date(year, month, startDay, 0, 0, 0, 0);
  const end = new Date(year, month + 1, startDay, 0, 0, 0, 0);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

// Human label for the financial month — named after the calendar month its
// cycle starts in (e.g. the 25 Jun–24 Jul cycle is "June 2026").
export function monthRangeLabel(date: Date, startDay: number): string {
  const { start } = getMonthRange(date, startDay);
  return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Start of the week containing `date`, honoring the configured first day.
export function startOfWeek(date: Date, weekStart: WeekStart): Date {
  const r = new Date(date);
  const dow = r.getDay(); // 0 = Sunday … 6 = Saturday
  const offset = weekStart === "monday" ? (dow + 6) % 7 : dow;
  r.setDate(r.getDate() - offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

// Weekday header labels (length 7) ordered by the configured first day.
export function weekdayLabels(weekStart: WeekStart): string[] {
  const base = ["S", "M", "T", "W", "T", "F", "S"];
  return weekStart === "monday" ? [...base.slice(1), base[0]!] : base;
}
