import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { breakdownBy, filterByType, type StatsTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { colorAt, mergeByName } from "../../lib/chart";

type Props = {
  txns: StatsTxn[];
};

type Kind = "expense" | "income";

export function CategoryBreakdownCard({ txns }: Props) {
  const [kind, setKind] = useState<Kind>("expense");
  const { rows: rawRows, total } = breakdownBy(filterByType(txns, kind), "category");
  const rows = mergeByName(rawRows);

  const data = rows.map((r, i) => ({
    name: r.name,
    value: r.total,
    color: r.color ?? colorAt(i),
  }));

  return (
    <ChartCard
      title="By category"
      right={
        <SegmentedControl
          size="xs"
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          data={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
      }
    >
      {data.length === 0 ? (
        <ChartEmpty />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <DonutChart
            data={data}
            size={180}
            thickness={26}
            withTooltip
            tooltipDataSource="segment"
            valueFormatter={(v) => formatCurrency(v)}
            chartLabel={formatCurrency(total)}
          />
          <ul className="flex w-full flex-1 flex-col gap-2">
            {rows.slice(0, 8).map((r, i) => (
              <li key={r.key} className="flex items-center gap-3 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color ?? colorAt(i) }}
                />
                <span className="min-w-0 flex-1 truncate text-text">{r.name}</span>
                <span className="text-text-muted">{r.pct.toFixed(0)}%</span>
                <span className="w-28 text-right font-medium text-text">
                  {formatCurrency(r.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
