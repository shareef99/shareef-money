import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { StatsSummary } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { ChartCard } from "./chart-card";
import { Text } from "../ui/text";
import { cn } from "../../lib/cn";

type Props = {
  current: StatsSummary;
  previous: StatsSummary;
};

type Direction = "up" | "down" | "flat";

function pctDelta(now: number, before: number): { text: string; dir: Direction } {
  if (before === 0) {
    if (now === 0) return { text: "0%", dir: "flat" };
    return { text: "new", dir: now > 0 ? "up" : "down" };
  }
  const delta = ((now - before) / Math.abs(before)) * 100;
  const dir: Direction = delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";
  return { text: `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`, dir };
}

// For income & net, up is good (green); for expense, up is bad (red).
function deltaColor(dir: Direction, higherIsGood: boolean): string {
  if (dir === "flat") return "text-text-muted";
  const good = dir === "up" ? higherIsGood : !higherIsGood;
  return good ? "text-income" : "text-expense";
}

function DeltaIcon({ dir }: { dir: Direction }) {
  if (dir === "up") return <ArrowUpRight size={14} />;
  if (dir === "down") return <ArrowDownRight size={14} />;
  return <Minus size={14} />;
}

export function PeriodComparisonCard({ current, previous }: Props) {
  const rows = [
    { label: "Income", now: current.income, before: previous.income, higherIsGood: true },
    { label: "Expense", now: current.expense, before: previous.expense, higherIsGood: false },
    { label: "Net", now: current.net, before: previous.net, higherIsGood: true },
  ];

  return (
    <ChartCard title="vs previous period">
      <div className="grid grid-cols-3 gap-3">
        {rows.map((r) => {
          const { text, dir } = pctDelta(r.now, r.before);
          const color = deltaColor(dir, r.higherIsGood);
          return (
            <div key={r.label}>
              <Text variant="secondary" size="xs">
                {r.label}
              </Text>
              <p className="mt-1 font-semibold text-text">{formatCurrency(r.now)}</p>
              <span className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium", color)}>
                <DeltaIcon dir={dir} />
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
