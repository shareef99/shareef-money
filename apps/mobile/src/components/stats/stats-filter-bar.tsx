import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useStatsFilter } from "./stats-filter-context";
import { StatsFilterSheet } from "./stats-filter-sheet";
import { SavedViewsBar } from "./saved-views-bar";
import type { ChipOption } from "./multi-select-chips";
import {
  activeFilterCount,
  navigatePeriod,
  periodLabel,
  withPeriod,
  type StatsPeriod,
} from "../../lib/stats-filter";
import { usePrefetchStatsPeriod } from "../../queries/use-stats";
import { useAccounts } from "../../queries/use-accounts";
import { useCategories } from "../../queries/use-categories";
import { useLocations } from "../../queries/use-locations";
import { useContacts } from "../../queries/use-contacts";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

const QUICK: { key: Exclude<StatsPeriod, "custom">; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export function StatsFilterBar() {
  const c = getColors(useColorScheme().colorScheme);
  const { filter, setFilter, rangeOpts } = useStatsFilter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const prefetch = usePrefetchStatsPeriod();

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { data: contacts = [] } = useContacts();

  const accountOpts: ChipOption[] = useMemo(
    () => accounts.map((a) => ({ id: a.id, name: a.name, color: a.color })),
    [accounts],
  );
  const categoryOpts: ChipOption[] = useMemo(
    () =>
      categories
        .filter((cat) => cat.parentId == null)
        .map((cat) => ({ id: cat.id, name: cat.name, color: cat.color })),
    [categories],
  );
  const locationOpts: ChipOption[] = useMemo(
    () => locations.map((l) => ({ id: l.id, name: l.name })),
    [locations],
  );
  const contactOpts: ChipOption[] = useMemo(
    () => contacts.map((p) => ({ id: p.id, name: p.name })),
    [contacts],
  );

  // Keep the adjacent periods warm so swiping is instant.
  useEffect(() => {
    prefetch(filter, rangeOpts);
  }, [filter, rangeOpts, prefetch]);

  const count = activeFilterCount(filter);
  const label = periodLabel(filter, rangeOpts);

  return (
    <View className="px-4 pt-2 pb-1">
      <View className="flex-row gap-2 mb-2">
        {QUICK.map((p) => {
          const on = filter.period === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setFilter((f) => withPeriod(f, p.key, rangeOpts))}
              className={cn(
                "flex-1 py-1.5 items-center rounded-full border",
                on ? "bg-primary border-primary" : "bg-card border-border",
              )}
            >
              <Text className={cn("text-sm", on ? "text-primary-foreground" : "text-text-secondary")}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setSheetOpen(true)}
          className={cn(
            "px-3 py-1.5 flex-row items-center rounded-full border",
            count > 0 ? "bg-primary/15 border-primary" : "bg-card border-border",
          )}
        >
          <SlidersHorizontal size={15} color={count > 0 ? c.primary : c.textSecondary} />
          {count > 0 ? (
            <View className="ml-1 min-w-4 h-4 px-1 rounded-full bg-primary items-center justify-center">
              <Text className="text-[10px] text-primary-foreground font-bold">{count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setFilter((f) => navigatePeriod(f, -1, rangeOpts))}
          disabled={filter.period === "custom"}
          className="p-2"
        >
          <ChevronLeft size={20} color={filter.period === "custom" ? c.textMuted : c.text} />
        </Pressable>
        <Text className="text-base font-semibold text-text">{label}</Text>
        <Pressable
          onPress={() => setFilter((f) => navigatePeriod(f, 1, rangeOpts))}
          disabled={filter.period === "custom"}
          className="p-2"
        >
          <ChevronRight size={20} color={filter.period === "custom" ? c.textMuted : c.text} />
        </Pressable>
      </View>

      <View className="mt-1">
        <SavedViewsBar />
      </View>

      <StatsFilterSheet
        visible={sheetOpen}
        filter={filter}
        rangeOpts={rangeOpts}
        accounts={accountOpts}
        categories={categoryOpts}
        locations={locationOpts}
        contacts={contactOpts}
        onApply={(next) => {
          setFilter(next);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
