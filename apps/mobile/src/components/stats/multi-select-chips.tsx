import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { getColors } from "../../lib/colors";
import { cn } from "../../lib/cn";

export type ChipOption = { id: number; name: string; color?: string | null };

type Props = {
  options: ChipOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  emptyText?: string;
};

// A wrapping row of toggleable chips used for account/category/location/people
// filters. No selection means "all".
export function MultiSelectChips({ options, selectedIds, onToggle, emptyText }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const selected = new Set(selectedIds);

  if (options.length === 0) {
    return <Text className="text-sm text-text-muted">{emptyText ?? "None"}</Text>;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.has(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            className={cn(
              "flex-row items-center px-3 py-1.5 rounded-full border",
              isOn ? "bg-primary/15 border-primary" : "bg-surface border-border",
            )}
          >
            {opt.color ? (
              <View
                className="w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ backgroundColor: opt.color }}
              />
            ) : null}
            <Text
              className={cn("text-sm", isOn ? "text-primary" : "text-text-secondary")}
              numberOfLines={1}
            >
              {opt.name}
            </Text>
            {isOn ? <Check size={13} color={c.primary} style={{ marginLeft: 4 }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
