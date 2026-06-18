import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = {
  daily: Map<string, number>;
  from: Date;
  to: Date;
  weekStartMonday: boolean;
};

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Daily-spend heatmap. One cell per day, laid out in weekday columns; darker =
// more spent. Cell size adapts so long ranges still fit.
export function CalendarHeatmapCard({ daily, from, to, weekStartMonday }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const width = Dimensions.get("window").width - 64;

  const layout = useMemo(() => {
    const colOffset = (d: Date) => {
      const dow = d.getDay();
      return weekStartMonday ? (dow + 6) % 7 : dow;
    };
    const cells: { col: number; row: number; v: number }[] = [];
    let max = 0;
    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);
    let col = colOffset(cur);
    let row = 0;
    let guard = 0;
    while (cur <= to && guard < 800) {
      const v = daily.get(keyOf(cur)) ?? 0;
      if (v > max) max = v;
      cells.push({ col, row, v });
      col += 1;
      if (col === 7) {
        col = 0;
        row += 1;
      }
      cur.setDate(cur.getDate() + 1);
      guard += 1;
    }
    const rows = (cells[cells.length - 1]?.row ?? 0) + 1;
    return { cells, rows, max };
  }, [daily, from, to, weekStartMonday]);

  const labels = weekStartMonday
    ? ["M", "T", "W", "T", "F", "S", "S"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  const gap = 3;
  const headerH = 14;
  const cell = Math.min((width - gap * 6) / 7, Math.max(8, (240 - headerH) / layout.rows - gap));
  const gridW = cell * 7 + gap * 6;
  const height = headerH + layout.rows * (cell + gap);

  return (
    <ChartCard title="Daily spend" subtitle="darker = more spent">
      {layout.max === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No expenses in this range</Text>
        </View>
      ) : (
        <Svg width={gridW} height={height}>
          {labels.map((l, i) => (
            <SvgText
              key={`h${i}`}
              x={i * (cell + gap) + cell / 2}
              y={10}
              fontSize={9}
              fill={c.textMuted}
              textAnchor="middle"
            >
              {l}
            </SvgText>
          ))}
          {layout.cells.map((cl, i) => {
            const intensity = cl.v > 0 ? 0.15 + 0.85 * (cl.v / layout.max) : 0;
            return (
              <Rect
                key={i}
                x={cl.col * (cell + gap)}
                y={headerH + cl.row * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={cl.v > 0 ? c.expense : c.surface}
                fillOpacity={cl.v > 0 ? intensity : 1}
              />
            );
          })}
        </Svg>
      )}
    </ChartCard>
  );
}
