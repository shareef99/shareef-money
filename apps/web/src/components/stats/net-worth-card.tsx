import { AreaChart } from "@mantine/charts";
import type { NetWorthPoint } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { compactMoney } from "../../lib/chart";

type Props = {
  points: NetWorthPoint[];
};

export function NetWorthCard({ points }: Props) {
  const latest = points.at(-1)?.value ?? 0;
  const data = points.map((p) => ({ label: p.label, value: p.value }));

  return (
    <ChartCard
      title="Net worth"
      subtitle="running balance"
      right={<span className="text-lg font-bold text-text">{formatCurrency(latest)}</span>}
    >
      {data.length === 0 ? (
        <ChartEmpty />
      ) : (
        <AreaChart
          h={260}
          data={data}
          dataKey="label"
          series={[{ name: "value", label: "Net worth", color: "var(--primary)" }]}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 56, tickFormatter: compactMoney }}
          curveType="monotone"
          withGradient
          withDots={false}
        />
      )}
    </ChartCard>
  );
}
