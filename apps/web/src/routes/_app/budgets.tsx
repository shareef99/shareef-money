import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ActionIcon, SegmentedControl } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { breakdownBy, effectiveBudget, filterByType } from "@shareef-money/shared/calc";
import { formatCurrency, setActiveCurrency } from "@shareef-money/shared/utils";
import { getTransactions } from "../../queries/transactions";
import { getCategories } from "../../queries/categories";
import { getSettings } from "../../queries/settings";
import { parseBudgets } from "../../queries/budgets";
import { toStatsTxns } from "../../lib/stats";
import { monthKey, periodRange } from "../../lib/period";
import { Title } from "../../components/ui/title";
import { Text } from "../../components/ui/text";
import { SetBudgetModal } from "../../components/budgets/set-budget-modal";
import { cn } from "../../lib/cn";

export const Route = createFileRoute("/_app/budgets")({
  loader: async ({ context: { queryClient } }) => {
    const settings = await queryClient.ensureQueryData(getSettings());
    setActiveCurrency(settings.currency_code);
    await Promise.all([
      queryClient.ensureQueryData(getTransactions({ limit: 500 })),
      queryClient.ensureQueryData(getCategories()),
    ]);
  },
  component: BudgetsPage,
});

type Kind = "expense" | "income";

type EditTarget = {
  categoryId: number;
  categoryName: string;
  currentBudget: number;
  hasMonthOverride: boolean;
};

function BudgetsPage() {
  const { data: txns } = useSuspenseQuery(getTransactions({ limit: 500 }));
  const { data: categories } = useSuspenseQuery(getCategories());
  const { data: settings } = useSuspenseQuery(getSettings());

  const [kind, setKind] = useState<Kind>("expense");
  const [anchor, setAnchor] = useState(() => new Date());
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const budgets = parseBudgets(settings);
  const mKey = monthKey(anchor);

  const { rows, totalBudget, totalActual, label } = useMemo(() => {
    const { from, to, label } = periodRange("monthly", anchor, false);
    const stats = toStatsTxns(txns, { accounts: [], categories, locations: [] }).filter(
      (t) => t.date >= from && t.date <= to,
    );
    const actualByCategory = new Map<number, number>();
    let total = 0;
    for (const r of breakdownBy(filterByType(stats, kind), "category").rows) {
      if (r.id != null) actualByCategory.set(r.id, r.total);
      total += r.total;
    }

    const monthOverride = budgets.months[mKey] ?? {};
    const topLevel = categories.filter(
      (c) => c.parentId === null && c.type === kind && !c.isArchived,
    );
    const rows = topLevel
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? "var(--primary)",
        budget: effectiveBudget(budgets, mKey, c.id),
        actual: actualByCategory.get(c.id) ?? 0,
        hasMonthOverride: monthOverride[String(c.id)] != null,
      }))
      .sort((a, b) => b.budget + b.actual - (a.budget + a.actual) || a.name.localeCompare(b.name));

    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    return { rows, totalBudget, totalActual: total, label };
  }, [txns, categories, budgets, kind, anchor, mKey]);

  const shiftMonth = (delta: number) =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1));

  const overallPct = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0;
  const overBudget = totalBudget > 0 && totalActual > totalBudget;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title order={1}>Budgets</Title>
        <SegmentedControl
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          data={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ActionIcon variant="muted" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </ActionIcon>
          <Text as="span" weight="semibold" size="base" className="w-40 text-center">
            {label}
          </Text>
          <ActionIcon variant="muted" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </ActionIcon>
        </div>
        <div className="text-right">
          <Text variant="secondary" size="xs">
            {overBudget ? "Over budget" : "Spent of budget"}
          </Text>
          <p className={cn("font-semibold", overBudget ? "text-expense" : "text-text")}>
            {formatCurrency(totalActual)}
            <span className="text-text-muted"> / {formatCurrency(totalBudget)}</span>
          </p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-card-alt">
        <div
          className={cn("h-full rounded-full", overBudget ? "bg-expense" : "bg-primary")}
          style={{ width: `${Math.max(overallPct, totalActual > 0 ? 2 : 0)}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((r) => {
          const over = r.budget > 0 && r.actual > r.budget;
          const pct = r.budget > 0 ? Math.min((r.actual / r.budget) * 100, 100) : 0;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() =>
                  setEditTarget({
                    categoryId: r.id,
                    categoryName: r.name,
                    currentBudget: r.budget,
                    hasMonthOverride: r.hasMonthOverride,
                  })
                }
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-card-alt"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="truncate font-medium text-text">{r.name}</span>
                    {r.hasMonthOverride && (
                      <span className="rounded bg-card-alt px-1.5 py-0.5 text-[10px] text-text-muted">
                        this month
                      </span>
                    )}
                  </div>
                  <span className={cn("shrink-0 text-sm font-medium", over ? "text-expense" : "text-text")}>
                    {formatCurrency(r.actual)}
                    <span className="text-text-muted">
                      {" "}
                      / {r.budget > 0 ? formatCurrency(r.budget) : "—"}
                    </span>
                  </span>
                </div>
                {r.budget > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-card-alt">
                    <div
                      className={cn("h-full rounded-full", over ? "bg-expense" : "bg-primary")}
                      style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: over ? undefined : r.color }}
                    />
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {editTarget && (
        <SetBudgetModal
          opened={!!editTarget}
          onClose={() => setEditTarget(null)}
          categoryId={editTarget.categoryId}
          categoryName={editTarget.categoryName}
          monthKey={mKey}
          currentBudget={editTarget.currentBudget}
          hasMonthOverride={editTarget.hasMonthOverride}
        />
      )}
    </div>
  );
}
