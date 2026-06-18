import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { flow, type StatsTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { ChartEmpty } from "./chart-empty";

type Props = {
  txns: StatsTxn[];
};

// Income categories → accounts → expense categories.
export function SankeyCard({ txns }: Props) {
  const { nodes, links } = flow(txns);
  const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

  const data = {
    nodes: nodes.map((n) => ({ name: n.name })),
    links: links
      .map((l) => ({
        source: nodeIndex.get(l.source) ?? -1,
        target: nodeIndex.get(l.target) ?? -1,
        value: l.value,
      }))
      .filter((l) => l.source >= 0 && l.target >= 0 && l.value > 0),
  };

  return (
    <ChartCard title="Money flow" subtitle="income → accounts → expenses">
      {data.links.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <Sankey
            data={data}
            nodePadding={26}
            nodeWidth={12}
            margin={{ top: 8, bottom: 8, left: 4, right: 4 }}
            link={{ stroke: "var(--primary)", strokeOpacity: 0.15 }}
            node={{ fill: "var(--primary)", stroke: "var(--card)" }}
          >
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
