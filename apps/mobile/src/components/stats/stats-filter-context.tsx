import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSettings } from "../../queries/use-settings";
import {
  makeDefaultFilter,
  type RangeOpts,
  type StatsFilter,
} from "../../lib/stats-filter";

type StatsFilterContextValue = {
  filter: StatsFilter;
  setFilter: (next: StatsFilter | ((prev: StatsFilter) => StatsFilter)) => void;
  rangeOpts: RangeOpts;
};

const StatsFilterContext = createContext<StatsFilterContextValue | null>(null);

export function useStatsFilter(): StatsFilterContextValue {
  const ctx = useContext(StatsFilterContext);
  if (!ctx) {
    throw new Error("useStatsFilter must be used within a StatsFilterProvider");
  }
  return ctx;
}

// Local to the Stats screen — one source of truth shared by the filter bar,
// the filter sheet, and every chart. Not global app state.
export function StatsFilterProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const rangeOpts = useMemo<RangeOpts>(
    () => ({
      monthStartDay: settings.monthStartDay,
      weekStart: settings.weekStartDay,
    }),
    [settings.monthStartDay, settings.weekStartDay],
  );

  const [filter, setFilter] = useState<StatsFilter>(() =>
    makeDefaultFilter(rangeOpts),
  );

  const value = useMemo(
    () => ({ filter, setFilter, rangeOpts }),
    [filter, rangeOpts],
  );

  return (
    <StatsFilterContext value={value}>{children}</StatsFilterContext>
  );
}
