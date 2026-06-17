import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import Sortable from "react-native-sortables";
import { Menu, Minus, Pencil } from "lucide-react-native";
import type { Category } from "@shareef-money/db/schema";
import { getColors } from "../lib/colors";

type Props = {
  category: Category;
  onEditPress: () => void;
  onDeletePress: () => void;
};

export function SortableCategoryRow({ category, onEditPress, onDeletePress }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  return (
    <View className="flex-row items-center px-4 py-3 bg-background border-b border-border">
      <Pressable onPress={onDeletePress} className="mr-3" hitSlop={8}>
        <View className="w-6 h-6 rounded-full bg-error items-center justify-center">
          <Minus size={14} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Pressable>
      <View
        className="w-3 h-3 rounded-full mr-3"
        style={{ backgroundColor: category.color ?? c.textMuted }}
      />
      <Text className="text-base text-text flex-1">{category.name}</Text>
      <Pressable onPress={onEditPress} className="p-2" hitSlop={8}>
        <Pencil size={18} color={c.textSecondary} />
      </Pressable>
      <Sortable.Handle>
        <View className="p-2 ml-1">
          <Menu size={18} className="text-text-secondary" />
        </View>
      </Sortable.Handle>
    </View>
  );
}
