import { Heatmap } from "@mantine/charts";
import { dailyTotals, type StatsTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";

type Props = {
  txns: StatsTxn[];
  from: Date;
  to: Date;
  weekStartMonday: boolean;
};

const COLORS = ["var(--card-alt)", "#f1c4c0", "#e88e88", "#e0534c", "#b23b35"];

export function CalendarHeatmapCard({ txns, from, to, weekStartMonday }: Props) {
  const data = Object.fromEntries(dailyTotals(txns, "expense"));
  const hasData = Object.keys(data).length > 0;

  return (
    <ChartCard title="Daily spend" subtitle="darker = more spent">
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <div className="overflow-x-auto">
          <Heatmap
            data={data}
            startDate={from}
            endDate={to}
            firstDayOfWeek={weekStartMonday ? 1 : 0}
            rectSize={12}
            gap={2}
            withMonthLabels
            withTooltip
            withOutsideDates={false}
            colors={COLORS}
            getTooltipLabel={({ date, value }) =>
              `${date} — ${formatCurrency(value ?? 0)}`
            }
          />
        </div>
      )}
    </ChartCard>
  );
}
