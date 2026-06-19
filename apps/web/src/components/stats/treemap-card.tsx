import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { breakdownBy, filterByType, type StatsTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";
import { colorAt, mergeByName } from "../../lib/chart";

type Props = {
  txns: StatsTxn[];
};

type CellProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
  index?: number;
};

function TreemapCell({ x = 0, y = 0, width = 0, height = 0, name, fill, index = 0 }: CellProps) {
  const color = fill ?? colorAt(index);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} stroke="var(--card)" strokeWidth={2} />
      {width > 56 && height > 22 && (
        <text x={x + 6} y={y + 16} fontSize={12} fill="#fff" className="pointer-events-none">
          {name}
        </text>
      )}
    </g>
  );
}

export function TreemapCard({ txns }: Props) {
  const rows = mergeByName(breakdownBy(filterByType(txns, "expense"), "category").rows);
  const data = rows.slice(0, 12).map((r, i) => ({
    name: r.name,
    size: r.total,
    fill: r.color ?? colorAt(i),
  }));

  return (
    <ChartCard title="Expense treemap" subtitle="area = amount spent">
      {data.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <Treemap data={data} dataKey="size" isAnimationActive={false} content={<TreemapCell />}>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
