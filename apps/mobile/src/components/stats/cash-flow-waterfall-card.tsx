import { useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { CashFlow } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { flow: CashFlow };

const H = 200;

// Opening → +income → −expense → (−fees) → closing, as a floating-bar waterfall.
export function CashFlowWaterfallCard({ flow }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const width = Dimensions.get("window").width - 64;

  const layout = useMemo(() => {
    type Step = { label: string; from: number; to: number; color: string };
    const steps: Step[] = [];
    let run = flow.opening;
    steps.push({ label: "Opening", from: 0, to: flow.opening, color: c.transfer });
    steps.push({ label: "+ Income", from: run, to: run + flow.income, color: c.income });
    run += flow.income;
    steps.push({ label: "− Expense", from: run, to: run - flow.expense, color: c.expense });
    run -= flow.expense;
    if (flow.fees > 0) {
      steps.push({ label: "− Fees", from: run, to: run - flow.fees, color: c.expense });
      run -= flow.fees;
    }
    steps.push({ label: "Closing", from: 0, to: flow.closing, color: c.primary });

    const vals = steps.flatMap((s) => [s.from, s.to]).concat(0);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const span = max - min || 1;
    const yOf = (v: number) => H - ((v - min) / span) * H;

    const n = steps.length;
    const gap = 10;
    const barW = (width - gap * (n + 1)) / n;
    const laid = steps.map((s, i) => {
      const x = gap + i * (barW + gap);
      const yTop = yOf(Math.max(s.from, s.to));
      const yBot = yOf(Math.min(s.from, s.to));
      return { ...s, x, yTop, h: Math.max(2, yBot - yTop), barW };
    });
    return { laid, zeroY: yOf(0) };
  }, [flow, width, c]);

  return (
    <ChartCard title="Cash flow" subtitle="how net worth moved this period">
      <Svg width={width} height={H + 26}>
        <Line x1={0} y1={layout.zeroY} x2={width} y2={layout.zeroY} stroke={c.border} strokeWidth={1} />
        {layout.laid.map((s) => (
          <Rect
            key={s.label}
            x={s.x}
            y={s.yTop}
            width={s.barW}
            height={s.h}
            rx={2}
            fill={s.color}
            fillOpacity={s.label === "Opening" || s.label === "Closing" ? 0.9 : 0.75}
          />
        ))}
        {layout.laid.map((s) => (
          <SvgText
            key={`l${s.label}`}
            x={s.x + s.barW / 2}
            y={H + 16}
            fontSize={9}
            fill={c.textSecondary}
            textAnchor="middle"
          >
            {s.label}
          </SvgText>
        ))}
      </Svg>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-text-muted">Opening {formatCurrency(flow.opening)}</Text>
        <Text className="text-xs text-text">Closing {formatCurrency(flow.closing)}</Text>
      </View>
    </ChartCard>
  );
}
