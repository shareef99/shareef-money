import { BarChart } from "@mantine/charts";
import { stackedByCategory, type StatsTxn, type TimeBucket } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { colorAt, compactMoney } from "../../lib/chart";

type Props = {
  txns: StatsTxn[];
  from: Date;
  to: Date;
  bucket: TimeBucket;
  weekStartMonday: boolean;
};

export function SpendingMixCard({ txns, from, to, bucket, weekStartMonday }: Props) {
  const { labels, series } = stackedByCategory(txns, from, to, bucket, weekStartMonday, "expense", 5);

  // Key series by index (s0, s1…) so two categories with the same name don't collide.
  const chartSeries = series.map((s, i) => ({
    name: `s${i}`,
    label: s.name,
    color: s.color ?? colorAt(i),
  }));
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    series.forEach((s, si) => {
      row[`s${si}`] = s.values[i] ?? 0;
    });
    return row;
  });
  const hasData = series.some((s) => s.total > 0);

  return (
    <ChartCard title="Spending mix" subtitle="top categories per period">
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <BarChart
          h={280}
          data={data}
          dataKey="label"
          type="stacked"
          series={chartSeries}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 52, tickFormatter: compactMoney }}
          withLegend
        />
      )}
    </ChartCard>
  );
}
