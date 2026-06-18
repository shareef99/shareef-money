import { ActionIcon, SegmentedControl } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Period } from "../../lib/period";
import { Text } from "../ui/text";

type Props = {
  period: Period;
  onPeriodChange: (period: Period) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
};

export function StatsFilterBar({ period, onPeriodChange, label, onPrev, onNext }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3">
      <SegmentedControl
        value={period}
        onChange={(v) => onPeriodChange(v as Period)}
        data={[
          { label: "Week", value: "weekly" },
          { label: "Month", value: "monthly" },
          { label: "Year", value: "annually" },
        ]}
      />
      <div className="flex items-center gap-2">
        <ActionIcon variant="muted" onClick={onPrev} aria-label="Previous period">
          <ChevronLeft size={18} />
        </ActionIcon>
        <Text as="span" weight="semibold" size="base" className="min-w-44 text-center">
          {label}
        </Text>
        <ActionIcon variant="muted" onClick={onNext} aria-label="Next period">
          <ChevronRight size={18} />
        </ActionIcon>
      </div>
    </div>
  );
}
