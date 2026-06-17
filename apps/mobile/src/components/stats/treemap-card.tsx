import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { BreakdownRow } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { chartColor } from "../../lib/chart-colors";
import { getColors } from "../../lib/colors";

type Props = { rows: BreakdownRow[]; subtitle?: string };

type Cell = { x: number; y: number; w: number; h: number; name: string; color: string; total: number };

// Squarified treemap of category spend — area encodes magnitude.
function squarify(
  items: { value: number; name: string; color: string }[],
  x0: number,
  y0: number,
  w0: number,
  h0: number,
): Cell[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return [];
  const area = w0 * h0;
  const scaled = items.map((i) => ({ ...i, a: (i.value / total) * area }));

  const out: Cell[] = [];
  let x = x0;
  let y = y0;
  let w = w0;
  let h = h0;
  let i = 0;

  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0);
    const mx = Math.max(...row);
    const mn = Math.min(...row);
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };

  while (i < scaled.length) {
    const side = Math.min(w, h);
    const row: number[] = [];
    let start = i;
    while (i < scaled.length) {
      const next = [...row, scaled[i]!.a];
      if (row.length === 0 || worst(next, side) <= worst(row, side)) {
        row.push(scaled[i]!.a);
        i += 1;
      } else break;
    }
    const rowSum = row.reduce((a, b) => a + b, 0);
    if (w <= h) {
      const rowH = rowSum / w;
      let cx = x;
      for (let k = 0; k < row.length; k++) {
        const cw = row[k]! / rowH;
        const it = scaled[start + k]!;
        out.push({ x: cx, y, w: cw, h: rowH, name: it.name, color: it.color, total: it.value });
        cx += cw;
      }
      y += rowH;
      h -= rowH;
    } else {
      const colW = rowSum / h;
      let cy = y;
      for (let k = 0; k < row.length; k++) {
        const ch = row[k]! / colW;
        const it = scaled[start + k]!;
        out.push({ x, y: cy, w: colW, h: ch, name: it.name, color: it.color, total: it.value });
        cy += ch;
      }
      x += colW;
      w -= colW;
    }
  }
  return out;
}

export function TreemapCard({ rows, subtitle }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const width = Dimensions.get("window").width - 64;
  const height = 220;

  const cells = useMemo(() => {
    const items = rows
      .slice(0, 12)
      .filter((r) => r.total > 0)
      .map((r, i) => ({ value: r.total, name: r.name, color: r.color ?? chartColor(i) }));
    return squarify(items, 0, 0, width, height);
  }, [rows, width]);

  return (
    <ChartCard title="Category treemap" subtitle={subtitle}>
      {cells.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No data in this range</Text>
        </View>
      ) : (
        <Svg width={width} height={height}>
          {cells.map((cell, i) => (
            <Rect
              key={i}
              x={cell.x + 1}
              y={cell.y + 1}
              width={Math.max(0, cell.w - 2)}
              height={Math.max(0, cell.h - 2)}
              rx={3}
              fill={cell.color}
              fillOpacity={0.85}
            />
          ))}
          {cells.map((cell, i) =>
            cell.w > 54 && cell.h > 22 ? (
              <SvgText
                key={`t${i}`}
                x={cell.x + 6}
                y={cell.y + 16}
                fontSize={10}
                fill="#ffffff"
                fontWeight="600"
              >
                {cell.name.length > 12 ? cell.name.slice(0, 11) + "…" : cell.name}
              </SvgText>
            ) : null,
          )}
          {cells.map((cell, i) =>
            cell.w > 54 && cell.h > 38 ? (
              <SvgText key={`v${i}`} x={cell.x + 6} y={cell.y + 30} fontSize={9} fill="#ffffffcc">
                {formatCurrency(cell.total)}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
    </ChartCard>
  );
}
