import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

type Slice = { value: number; color: string };

type Props = {
  slices: Slice[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
};

// Polar -> cartesian for arc endpoints.
function point(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = point(cx, cy, r, end);
  const e = point(cx, cy, r, start);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

export function DonutChart({ slices, size = 200, strokeWidth = 28, children }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  let cursor = 0;
  const arcs = total
    ? slices.map((slice, i) => {
        const sweep = (slice.value / total) * 360;
        const start = cursor;
        const end = cursor + sweep;
        cursor = end;
        // A full-circle slice can't be drawn as an arc; use a Circle instead.
        if (sweep >= 359.999) {
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={slice.color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          );
        }
        return (
          <Path
            key={i}
            d={arcPath(cx, cy, r, start, end)}
            stroke={slice.color}
            strokeWidth={strokeWidth}
            fill="none"
          />
        );
      })
    : null;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {total === 0 ? (
          <Circle cx={cx} cy={cy} r={r} stroke="#00000022" strokeWidth={strokeWidth} fill="none" />
        ) : (
          <G>{arcs}</G>
        )}
      </Svg>
      {children}
    </View>
  );
}
