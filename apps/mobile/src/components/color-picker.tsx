import { Pressable, ScrollView, View } from "react-native";
import { Check } from "lucide-react-native";

// Palette offered for category/account colors. First entry is the default.
export const PICKER_COLORS = [
  "#2F80D8",
  "#E0534C",
  "#E8A33D",
  "#3FB68B",
  "#9B6FD4",
  "#E06FA8",
  "#5BB0C9",
  "#C9883D",
  "#7A8B9A",
  "#8FB339",
  "#D96E4B",
  "#5C6BC0",
  "#EC407A",
  "#26A69A",
  "#AB47BC",
  "#FF7043",
];

export const DEFAULT_PICKER_COLOR = PICKER_COLORS[0]!;

type Props = {
  value: string | null | undefined;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
    >
      {PICKER_COLORS.map((color) => {
        const selected = value?.toLowerCase() === color.toLowerCase();
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={{ backgroundColor: color }}
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-80"
          >
            {selected ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
