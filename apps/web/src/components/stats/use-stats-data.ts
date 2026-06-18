import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  autoBucket,
  breakdownBy,
  cashFlow as computeCashFlow,
  computeDebtLedger,
  debtTrend,
  filterByType,
  netWorthSeries,
  openingBalance,
  summarize,
  transferMatrix,
} from "@shareef-money/shared/calc";
import { getAccounts } from "../../queries/accounts";
import { getCategories } from "../../queries/categories";
import { getContacts } from "../../queries/contacts";
import { getLocations } from "../../queries/locations";
import { getSettings } from "../../queries/settings";
import { getTransactions } from "../../queries/transactions";
import { parseBudgets } from "../../queries/budgets";
import {
  toDebtLedgerTxns,
  toDebtTrendTxns,
  toNetWorthTxns,
  toStatsTxns,
} from "../../lib/stats";
import { monthKey, periodRange, previousRange, type Period } from "../../lib/period";
import type { RankedItem } from "./ranked-bar-card";

// Assembles every derivation the stats dashboard needs from the cached REST
// data. Cross-cutting series (net worth, cash flow, debts, budgets) are computed
// here; the simpler per-chart breakdowns are derived inside each card.
export function useStatsData(period: Period, anchor: Date) {
  const { data: settings } = useSuspenseQuery(getSettings());
  const { data: accounts } = useSuspenseQuery(getAccounts());
  const { data: categories } = useSuspenseQuery(getCategories());
  const { data: locations } = useSuspenseQuery(getLocations());
  const { data: contacts } = useSuspenseQuery(getContacts());
  const { data: allTxns } = useSuspenseQuery(getTransactions({ limit: 500 }));

  const weekStartMonday = settings.weekly_start_day === "monday";

  return useMemo(() => {
    const { from, to, label } = periodRange(period, anchor, weekStartMonday);
    const bucket = autoBucket(from, to);
    const prev = previousRange(period, anchor, weekStartMonday);

    const enrichedAll = toStatsTxns(allTxns, { accounts, categories, locations });
    const rangeTxns = enrichedAll.filter((t) => t.date >= from && t.date <= to);
    const prevTxns = enrichedAll.filter((t) => t.date >= prev.from && t.date <= prev.to);

    const summary = summarize(rangeTxns);
    const prevSummary = summarize(prevTxns);

    // Net worth + cash flow (all transaction types contribute via netWorthDelta).
    const initialTotal = accounts.reduce((sum, a) => sum + a.initialBalance, 0);
    const nwTxns = toNetWorthTxns(allTxns);
    const prior = nwTxns.filter((t) => t.date < from);
    const rangeNw = nwTxns.filter((t) => t.date >= from && t.date <= to);
    const opening = openingBalance(initialTotal, prior);
    const netWorthPoints = netWorthSeries(opening, rangeNw, from, to, bucket, weekStartMonday);
    const cashFlow = computeCashFlow(opening, rangeNw);

    // Debts (current position is across all history, not range-filtered).
    const contactNames = new Map(contacts.map((c) => [c.id, c.name]));
    const debtLedger = computeDebtLedger(toDebtLedgerTxns(allTxns, contactNames), Date.now());
    const debtTrendTxns = toDebtTrendTxns(allTxns).filter((t) => t.date <= to);
    const debtTrendPoints = debtTrend(debtTrendTxns, from, to, bucket, weekStartMonday);

    // Budgets vs actual (month view).
    const budgets = parseBudgets(settings);
    const mKey = monthKey(from);
    const actualByCategory = new Map<number, number>();
    const expenseByCategory = breakdownBy(filterByType(rangeTxns, "expense"), "category");
    for (const r of expenseByCategory.rows) {
      if (r.id != null) actualByCategory.set(r.id, r.total);
    }

    // Ranked bars.
    const transferItems: RankedItem[] = transferMatrix(rangeTxns).map((e) => ({
      id: `${e.fromId}-${e.toId}`,
      label: `${e.fromName} → ${e.toName}`,
      value: e.total,
      color: "var(--transfer)",
    }));
    const locationItems: RankedItem[] = breakdownBy(
      filterByType(rangeTxns, "expense"),
      "location",
    ).rows.map((r) => ({ id: r.key, label: r.name, value: r.total }));
    const peopleItems: RankedItem[] = breakdownBy(
      filterByType(rangeTxns, "expense"),
      "person",
      contactNames,
    ).rows.map((r) => ({ id: r.key, label: r.name, value: r.total }));

    return {
      from,
      to,
      label,
      bucket,
      weekStartMonday,
      rangeTxns,
      summary,
      prevSummary,
      netWorthPoints,
      cashFlow,
      debtLedger,
      debtTrendPoints,
      budgets,
      monthKey: mKey,
      actualByCategory,
      categories,
      transferItems,
      locationItems,
      peopleItems,
    };
  }, [period, anchor, weekStartMonday, allTxns, accounts, categories, locations, contacts, settings]);
}
