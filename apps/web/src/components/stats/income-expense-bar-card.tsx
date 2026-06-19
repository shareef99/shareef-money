import { BarChart } from "@mantine/charts";
import { timeSeries, type StatsTxn, type TimeBucket } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { compactMoney } from "../../lib/chart";

type Props = {
  txns: StatsTxn[];
  from: Date;
  to: Date;
  bucket: TimeBucket;
  weekStartMonday: boolean;
};

const SUBTITLE: Record<TimeBucket, string> = {
  day: "by day",
  week: "by week",
  month: "by month",
};

export function IncomeExpenseBarCard({ txns, from, to, bucket, weekStartMonday }: Props) {
  const points = timeSeries(txns, from, to, bucket, weekStartMonday);
  const data = points.map((p) => ({ label: p.label, income: p.income, expense: p.expense }));
  const hasData = points.some((p) => p.income > 0 || p.expense > 0);

  return (
    <ChartCard title="Income vs expense" subtitle={SUBTITLE[bucket]}>
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <BarChart
          h={260}
          data={data}
          dataKey="label"
          series={[
            { name: "income", label: "Income", color: "var(--income)" },
            { name: "expense", label: "Expense", color: "var(--expense)" },
          ]}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 52, tickFormatter: compactMoney }}
          withLegend
        />
      )}
    </ChartCard>
  );
}
