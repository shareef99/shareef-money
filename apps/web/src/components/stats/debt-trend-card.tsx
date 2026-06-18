import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { LineChart } from "@mantine/charts";
import type { DebtTrendPoint } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { compactMoney } from "../../lib/chart";

type Props = {
  points: DebtTrendPoint[];
};

type View = "both" | "receivable" | "payable";

const ALL_SERIES = [
  { name: "receivable", label: "Owed to you", color: "var(--income)" },
  { name: "payable", label: "You owe", color: "var(--expense)" },
  { name: "net", label: "Net", color: "var(--primary)" },
] as const;

export function DebtTrendCard({ points }: Props) {
  const [view, setView] = useState<View>("both");
  const data = points.map((p) => ({
    label: p.label,
    receivable: p.receivable,
    payable: p.payable,
    net: p.net,
  }));
  const hasData = points.some((p) => p.receivable !== 0 || p.payable !== 0);

  const series =
    view === "both"
      ? ALL_SERIES.slice()
      : ALL_SERIES.filter((s) => s.name === view || s.name === "net");

  return (
    <ChartCard
      title="Debt trend"
      subtitle="position over time"
      right={
        <SegmentedControl
          size="xs"
          value={view}
          onChange={(v) => setView(v as View)}
          data={[
            { label: "Both", value: "both" },
            { label: "Owed", value: "receivable" },
            { label: "Owe", value: "payable" },
          ]}
        />
      }
    >
      {!hasData ? (
        <ChartEmpty message="No debt activity for this period." />
      ) : (
        <LineChart
          h={260}
          data={data}
          dataKey="label"
          series={series}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 56, tickFormatter: compactMoney }}
          referenceLines={[{ y: 0, color: "var(--border)" }]}
          withDots={false}
          curveType="monotone"
        />
      )}
    </ChartCard>
  );
}
