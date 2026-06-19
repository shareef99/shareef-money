import type { BreakdownRow } from "@shareef-money/shared/calc";

// Shared chart helpers: a fallback palette for series without their own color,
// and compact axis formatting for money stored in the smallest unit (paise).

export const CHART_PALETTE = [
  "#2f80d8",
  "#e0534c",
  "#d97706",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#0d9488",
];

export function colorAt(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]!;
}

// Compact label for a smallest-unit amount, e.g. 500000 (paise) → "5k".
// Used for axis ticks where the full formatted currency would be too wide.
export function compactMoney(smallest: number): string {
  const major = smallest / 100;
  const abs = Math.abs(major);
  const sign = major < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}${Math.round(abs)}`;
}

// Collapse breakdown rows that share a display name into one (some accounts have
// several top-level categories with the same name). Charts keyed by name —
// recharts pies/treemaps — need this to avoid duplicate React keys and the
// resulting omitted slices.
export function mergeByName(rows: BreakdownRow[]): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  let total = 0;
  for (const r of rows) {
    total += r.total;
    const existing = map.get(r.name);
    if (existing) {
      existing.total += r.total;
      existing.count += r.count;
    } else {
      map.set(r.name, { ...r });
    }
  }
  const merged = [...map.values()].sort((a, b) => b.total - a.total);
  for (const r of merged) r.pct = total > 0 ? (r.total / total) * 100 : 0;
  return merged;
}
