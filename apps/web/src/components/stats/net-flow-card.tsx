import { LineChart } from "@mantine/charts";
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

export function NetFlowCard({ txns, from, to, bucket, weekStartMonday }: Props) {
  const points = timeSeries(txns, from, to, bucket, weekStartMonday);
  const data = points.map((p) => ({ label: p.label, net: p.net }));
  const hasData = points.some((p) => p.income > 0 || p.expense > 0);

  return (
    <ChartCard title="Net flow" subtitle="income − expense per period">
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <LineChart
          h={240}
          data={data}
          dataKey="label"
          series={[{ name: "net", label: "Net", color: "var(--primary)" }]}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 52, tickFormatter: compactMoney }}
          referenceLines={[{ y: 0, color: "var(--border)" }]}
          withDots={data.length <= 31}
          curveType="monotone"
        />
      )}
    </ChartCard>
  );
}
