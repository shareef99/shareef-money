import { BarChart } from "@mantine/charts";
import { breakdownBy, filterByType, type StatsTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { compactMoney } from "../../lib/chart";

type Props = {
  txns: StatsTxn[];
  weekStartMonday: boolean;
};

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DayOfWeekCard({ txns, weekStartMonday }: Props) {
  const { rows } = breakdownBy(filterByType(txns, "expense"), "dayOfWeek");
  const totalById = new Map(rows.map((r) => [r.id, r.total]));
  const order = weekStartMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const data = order.map((d) => ({ label: NAMES[d]!, value: totalById.get(d) ?? 0 }));
  const hasData = rows.length > 0;

  return (
    <ChartCard title="Spend by weekday" subtitle="expenses">
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <BarChart
          h={240}
          data={data}
          dataKey="label"
          series={[{ name: "value", label: "Spent", color: "var(--expense)" }]}
          valueFormatter={(v) => formatCurrency(v)}
          yAxisProps={{ width: 52, tickFormatter: compactMoney }}
        />
      )}
    </ChartCard>
  );
}
