import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { setActiveCurrency } from "@shareef-money/shared/utils";
import { getAccounts } from "../../queries/accounts";
import { getCategories } from "../../queries/categories";
import { getContacts } from "../../queries/contacts";
import { getLocations } from "../../queries/locations";
import { getSettings } from "../../queries/settings";
import { getTransactions } from "../../queries/transactions";
import { Title } from "../../components/ui/title";
import { StatsFilterBar } from "../../components/stats/stats-filter-bar";
import { SummaryCards } from "../../components/stats/summary-cards";
import { PeriodComparisonCard } from "../../components/stats/period-comparison-card";
import { CashFlowCard } from "../../components/stats/cash-flow-card";
import { CategoryBreakdownCard } from "../../components/stats/category-breakdown-card";
import { IncomeExpenseBarCard } from "../../components/stats/income-expense-bar-card";
import { NetFlowCard } from "../../components/stats/net-flow-card";
import { SpendingMixCard } from "../../components/stats/spending-mix-card";
import { NetWorthCard } from "../../components/stats/net-worth-card";
import { TreemapCard } from "../../components/stats/treemap-card";
import { DayOfWeekCard } from "../../components/stats/day-of-week-card";
import { SankeyCard } from "../../components/stats/sankey-card";
import { CalendarHeatmapCard } from "../../components/stats/calendar-heatmap-card";
import { RankedBarCard } from "../../components/stats/ranked-bar-card";
import { BudgetActualCard } from "../../components/stats/budget-actual-card";
import { DebtSummaryCard } from "../../components/stats/debt-summary-card";
import { DebtTrendCard } from "../../components/stats/debt-trend-card";
import { useStatsData } from "../../components/stats/use-stats-data";
import { shiftPeriod, type Period } from "../../lib/period";

export const Route = createFileRoute("/_app/stats")({
  loader: async ({ context: { queryClient } }) => {
    const settings = await queryClient.ensureQueryData(getSettings());
    setActiveCurrency(settings.currency_code);
    await Promise.all([
      queryClient.ensureQueryData(getTransactions({ limit: 500 })),
      queryClient.ensureQueryData(getAccounts()),
      queryClient.ensureQueryData(getCategories()),
      queryClient.ensureQueryData(getContacts()),
      queryClient.ensureQueryData(getLocations()),
    ]);
  },
  component: StatsPage,
});

function StatsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [anchor, setAnchor] = useState(() => new Date());
  const data = useStatsData(period, anchor);

  const changePeriod = (p: Period) => {
    setPeriod(p);
    setAnchor(new Date());
  };
  const shift = (delta: number) => setAnchor((a) => shiftPeriod(period, a, delta));

  return (
    <div className="flex flex-col gap-4">
      <Title order={1}>Stats</Title>

      <StatsFilterBar
        period={period}
        onPeriodChange={changePeriod}
        label={data.label}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
      />

      <SummaryCards summary={data.summary} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PeriodComparisonCard current={data.summary} previous={data.prevSummary} />
        <CashFlowCard cashFlow={data.cashFlow} />

        <div className="lg:col-span-2">
          <CategoryBreakdownCard txns={data.rangeTxns} />
        </div>

        <IncomeExpenseBarCard
          txns={data.rangeTxns}
          from={data.from}
          to={data.to}
          bucket={data.bucket}
          weekStartMonday={data.weekStartMonday}
        />
        <NetFlowCard
          txns={data.rangeTxns}
          from={data.from}
          to={data.to}
          bucket={data.bucket}
          weekStartMonday={data.weekStartMonday}
        />

        <SpendingMixCard
          txns={data.rangeTxns}
          from={data.from}
          to={data.to}
          bucket={data.bucket}
          weekStartMonday={data.weekStartMonday}
        />
        <NetWorthCard points={data.netWorthPoints} />

        <TreemapCard txns={data.rangeTxns} />
        <DayOfWeekCard txns={data.rangeTxns} weekStartMonday={data.weekStartMonday} />

        <div className="lg:col-span-2">
          <SankeyCard txns={data.rangeTxns} />
        </div>

        <div className="lg:col-span-2">
          <CalendarHeatmapCard
            txns={data.rangeTxns}
            from={data.from}
            to={data.to}
            weekStartMonday={data.weekStartMonday}
          />
        </div>

        <RankedBarCard
          title="Transfers"
          subtitle="account to account"
          items={data.transferItems}
          emptyMessage="No transfers this period."
        />
        <RankedBarCard
          title="Top locations"
          subtitle="by expense"
          items={data.locationItems}
          emptyMessage="No location data."
        />

        <RankedBarCard
          title="Top people"
          subtitle="by expense"
          items={data.peopleItems}
          emptyMessage="No tagged people."
        />
        {period === "monthly" && (
          <BudgetActualCard
            budgets={data.budgets}
            monthKey={data.monthKey}
            actualByCategory={data.actualByCategory}
            categories={data.categories}
          />
        )}

        <DebtSummaryCard ledger={data.debtLedger} />
        <DebtTrendCard points={data.debtTrendPoints} />
      </div>
    </div>
  );
}
