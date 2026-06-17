import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { flow, type StatsTxn } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { chartColor } from "../../lib/chart-colors";
import { getColors } from "../../lib/colors";

type Props = { txns: StatsTxn[] };

type Laid = {
  id: string;
  x: number;
  y: number;
  h: number;
  color: string;
  name: string;
  column: 0 | 1 | 2;
};

const H = 260;
const NODE_W = 9;
const GAP = 6;

// Income categories -> accounts -> expense categories, as a Sankey diagram
// built on react-native-svg (no chart lib has a usable RN Sankey).
export function SankeyCard({ txns }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const width = Dimensions.get("window").width - 64;

  const layout = useMemo(() => {
    const { nodes, links } = flow(txns);
    if (!nodes.length) return null;

    // Account node height should be its max(in,out) throughput.
    const inByAcc = new Map<string, number>();
    const outByAcc = new Map<string, number>();
    for (const l of links) {
      if (l.target.startsWith("acc:")) inByAcc.set(l.target, (inByAcc.get(l.target) ?? 0) + l.value);
      if (l.source.startsWith("acc:")) outByAcc.set(l.source, (outByAcc.get(l.source) ?? 0) + l.value);
    }
    for (const n of nodes) {
      if (n.column === 1) n.value = Math.max(inByAcc.get(n.id) ?? 0, outByAcc.get(n.id) ?? 0);
    }

    const cols: Laid[][] = [[], [], []];
    const colTotals = [0, 0, 0] as number[];
    for (const n of nodes) {
      if (n.value <= 0) continue;
      colTotals[n.column] += n.value;
    }
    const maxColTotal = Math.max(...colTotals, 1);
    const fallbackColors = new Map<string, string>();
    let ci = 0;
    const colorFor = (n: { id: string; color: string | null }) => {
      if (n.color) return n.color;
      let f = fallbackColors.get(n.id);
      if (!f) {
        f = chartColor(ci++);
        fallbackColors.set(n.id, f);
      }
      return f;
    };

    const xs = [2, (width - NODE_W) / 2, width - NODE_W - 2];
    const scale = (H - GAP * 6) / maxColTotal; // leave room for stack gaps

    const byId = new Map<string, Laid>();
    for (let col = 0 as 0 | 1 | 2; col <= 2; col = (col + 1) as 0 | 1 | 2) {
      const colNodes = nodes
        .filter((n) => n.column === col && n.value > 0)
        .sort((a, b) => b.value - a.value);
      const stackH = colNodes.reduce((s, n) => s + n.value * scale, 0) + GAP * (colNodes.length - 1);
      let y = Math.max(0, (H - stackH) / 2);
      for (const n of colNodes) {
        const h = Math.max(2, n.value * scale);
        const laid: Laid = {
          id: n.id,
          x: xs[col]!,
          y,
          h,
          color: colorFor(n),
          name: n.name,
          column: col,
        };
        cols[col]!.push(laid);
        byId.set(n.id, laid);
        y += h + GAP;
      }
    }

    // Build link bands with independent in/out offsets per node.
    const outOff = new Map<string, number>();
    const inOff = new Map<string, number>();
    const bands = links
      .filter((l) => byId.has(l.source) && byId.has(l.target) && l.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((l) => {
        const s = byId.get(l.source)!;
        const t = byId.get(l.target)!;
        const sBase = outOff.get(l.source) ?? s.y;
        const tBase = inOff.get(l.target) ?? t.y;
        const sH = l.value * scale;
        const tH = l.value * scale;
        outOff.set(l.source, sBase + sH);
        inOff.set(l.target, tBase + tH);
        const x1 = s.x + NODE_W;
        const x2 = t.x;
        const cxA = x1 + (x2 - x1) / 2;
        const path = `M ${x1} ${sBase} C ${cxA} ${sBase}, ${cxA} ${tBase}, ${x2} ${tBase} L ${x2} ${tBase + tH} C ${cxA} ${tBase + tH}, ${cxA} ${sBase + sH}, ${x1} ${sBase + sH} Z`;
        return { path, color: s.color };
      });

    return { cols, bands };
  }, [txns, width]);

  return (
    <ChartCard title="Money flow" subtitle="income → accounts → expenses">
      {!layout ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No flow in this range</Text>
        </View>
      ) : (
        <Svg width={width} height={H}>
          {layout.bands.map((b, i) => (
            <Path key={`b${i}`} d={b.path} fill={b.color} fillOpacity={0.32} />
          ))}
          {layout.cols.flat().map((n) => (
            <Rect key={n.id} x={n.x} y={n.y} width={NODE_W} height={n.h} rx={2} fill={n.color} />
          ))}
          {layout.cols.flat().map((n) =>
            n.h < 11 ? null : (
              <SvgText
                key={`t${n.id}`}
                x={n.column === 2 ? n.x - 4 : n.x + NODE_W + 4}
                y={n.y + n.h / 2 + 3}
                fontSize={9}
                fill={c.textSecondary}
                textAnchor={n.column === 2 ? "end" : "start"}
              >
                {n.name.length > 12 ? n.name.slice(0, 11) + "…" : n.name}
              </SvgText>
            ),
          )}
        </Svg>
      )}
    </ChartCard>
  );
}
