// categoryId (as string) -> amount in smallest unit.
export type BudgetMap = Record<string, number>;

export type BudgetData = {
  // Applies to every month unless overridden.
  default: BudgetMap;
  // "YYYY-MM" -> per-month overrides.
  months: Record<string, BudgetMap>;
};

// Effective budget for a category in a given month: a month override wins,
// otherwise the default.
export function effectiveBudget(
  data: BudgetData,
  monthKey: string,
  categoryId: number,
): number {
  const id = String(categoryId);
  return data.months[monthKey]?.[id] ?? data.default[id] ?? 0;
}
