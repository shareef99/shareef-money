import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from "nativewind";
import {
  clearFilters,
  withCustomRange,
  withPeriod,
  type RangeOpts,
  type StatsFilter,
  type StatsPeriod,
  type StatsTypeKey,
} from "../../lib/stats-filter";
import { MultiSelectChips, type ChipOption } from "./multi-select-chips";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

type Props = {
  visible: boolean;
  filter: StatsFilter;
  rangeOpts: RangeOpts;
  accounts: ChipOption[];
  categories: ChipOption[];
  locations: ChipOption[];
  contacts: ChipOption[];
  onApply: (next: StatsFilter) => void;
  onClose: () => void;
};

const TYPES: { key: StatsTypeKey; label: string }[] = [
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "transfer", label: "Transfer" },
];

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "custom", label: "Custom" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-5 py-3 border-b border-border">
      <Text className="text-xs font-semibold text-text-muted uppercase mb-2">{title}</Text>
      {children}
    </View>
  );
}

export function StatsFilterSheet({
  visible,
  filter,
  rangeOpts,
  accounts,
  categories,
  locations,
  contacts,
  onApply,
  onClose,
}: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const [draft, setDraft] = useState<StatsFilter>(filter);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);

  // Reset the draft to the live filter whenever the sheet opens.
  useEffect(() => {
    if (visible) {
      setDraft(filter);
      setPicker(null);
    }
  }, [visible, filter]);

  const toggleArr = (arr: number[], id: number) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const toggleType = (t: StatsTypeKey) =>
    setDraft((d) => ({
      ...d,
      types: d.types.includes(t) ? d.types.filter((x) => x !== t) : [...d.types, t],
    }));

  const moneyText = (v: number | null) => (v == null ? "" : String(Math.round(v / 100)));
  const parseMoney = (s: string): number | null => {
    const n = Number(s.replace(/[^0-9.]/g, ""));
    return s.trim() === "" || !Number.isFinite(n) ? null : Math.round(n * 100);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-card rounded-t-2xl max-h-[88%]" onPress={() => {}}>
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text className="text-lg font-semibold text-text">Filters</Text>
            <Pressable onPress={() => setDraft((d) => clearFilters(d))}>
              <Text className="text-sm text-primary">Reset</Text>
            </Pressable>
          </View>

          <ScrollView>
            <Section title="Type">
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setDraft((d) => ({ ...d, types: [] }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full border",
                    draft.types.length === 0
                      ? "bg-primary/15 border-primary"
                      : "bg-surface border-border",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      draft.types.length === 0 ? "text-primary" : "text-text-secondary",
                    )}
                  >
                    All
                  </Text>
                </Pressable>
                {TYPES.map((t) => {
                  const on = draft.types.includes(t.key);
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => toggleType(t.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border",
                        on ? "bg-primary/15 border-primary" : "bg-surface border-border",
                      )}
                    >
                      <Text className={cn("text-sm", on ? "text-primary" : "text-text-secondary")}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Period">
              <View className="flex-row flex-wrap gap-2 mb-2">
                {PERIODS.map((p) => {
                  const on = draft.period === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() =>
                        setDraft((d) =>
                          p.key === "custom"
                            ? withCustomRange(d, d.from, d.to)
                            : withPeriod(d, p.key, rangeOpts),
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full border",
                        on ? "bg-primary/15 border-primary" : "bg-surface border-border",
                      )}
                    >
                      <Text className={cn("text-sm", on ? "text-primary" : "text-text-secondary")}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {draft.period === "custom" ? (
                <View className="flex-row gap-2">
                  <DateButton
                    label="From"
                    date={draft.from}
                    onPress={() => setPicker("from")}
                  />
                  <DateButton label="To" date={draft.to} onPress={() => setPicker("to")} />
                </View>
              ) : null}
            </Section>

            <Section title="Accounts">
              <MultiSelectChips
                options={accounts}
                selectedIds={draft.accountIds}
                onToggle={(id) => setDraft((d) => ({ ...d, accountIds: toggleArr(d.accountIds, id) }))}
                emptyText="No accounts"
              />
            </Section>

            <Section title="Categories">
              <MultiSelectChips
                options={categories}
                selectedIds={draft.categoryIds}
                onToggle={(id) => setDraft((d) => ({ ...d, categoryIds: toggleArr(d.categoryIds, id) }))}
                emptyText="No categories"
              />
            </Section>

            <Section title="Locations">
              <MultiSelectChips
                options={locations}
                selectedIds={draft.locationIds}
                onToggle={(id) => setDraft((d) => ({ ...d, locationIds: toggleArr(d.locationIds, id) }))}
                emptyText="No locations yet"
              />
            </Section>

            <Section title="People">
              <MultiSelectChips
                options={contacts}
                selectedIds={draft.contactIds}
                onToggle={(id) => setDraft((d) => ({ ...d, contactIds: toggleArr(d.contactIds, id) }))}
                emptyText="No people yet"
              />
            </Section>

            <Section title="Amount range">
              <View className="flex-row gap-2 items-center">
                <TextInput
                  placeholder="Min"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                  defaultValue={moneyText(draft.amountMin)}
                  onChangeText={(s) => setDraft((d) => ({ ...d, amountMin: parseMoney(s) }))}
                  className="flex-1 bg-surface rounded-lg px-3 py-2 text-text"
                />
                <Text className="text-text-muted">–</Text>
                <TextInput
                  placeholder="Max"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                  defaultValue={moneyText(draft.amountMax)}
                  onChangeText={(s) => setDraft((d) => ({ ...d, amountMax: parseMoney(s) }))}
                  className="flex-1 bg-surface rounded-lg px-3 py-2 text-text"
                />
              </View>
            </Section>

            <Section title="Search note">
              <TextInput
                placeholder="Contains…"
                placeholderTextColor={c.textMuted}
                defaultValue={draft.search}
                onChangeText={(s) => setDraft((d) => ({ ...d, search: s }))}
                className="bg-surface rounded-lg px-3 py-2 text-text"
              />
            </Section>

            <View className="h-4" />
          </ScrollView>

          <View className="flex-row gap-3 px-5 py-3 border-t border-border">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-surface items-center"
            >
              <Text className="text-text-secondary font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(draft)}
              className="flex-1 py-3 rounded-xl bg-primary items-center"
            >
              <Text className="text-primary-foreground font-medium">Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      {picker ? (
        <DateTimePicker
          value={picker === "from" ? draft.from : draft.to}
          mode="date"
          onChange={(_event, date) => {
            const chosen = date;
            setPicker(null);
            if (!chosen) return;
            setDraft((d) =>
              picker === "from"
                ? withCustomRange(d, chosen, d.to)
                : withCustomRange(d, d.from, chosen),
            );
          }}
        />
      ) : null}
    </Modal>
  );
}

function DateButton({
  label,
  date,
  onPress,
}: {
  label: string;
  date: Date;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1 bg-surface rounded-lg px-3 py-2.5">
      <Text className="text-[10px] text-text-muted">{label}</Text>
      <Text className="text-sm text-text">
        {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </Text>
    </Pressable>
  );
}
