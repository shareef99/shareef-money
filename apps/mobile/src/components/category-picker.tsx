import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";
import type { Category } from "@shareef-money/db/schema";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  categories: Category[];
  title?: string;
};

export function CategoryPicker({
  visible,
  onClose,
  onSelect,
  categories,
  title = "Select Category",
}: Props) {
  const parents = categories.filter((c) => !c.parentId);
  const getSubcategories = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-background mt-20 rounded-t-2xl">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-text">{title}</Text>
          <Pressable onPress={onClose} className="p-1">
            <X size={24} className="text-text-secondary" />
          </Pressable>
        </View>
        <FlatList
          data={parents}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const subs = getSubcategories(item.id);
            return (
              <View>
                <Pressable
                  className="flex-row items-center px-4 py-3 active:bg-card"
                  onPress={() => onSelect(item)}
                >
                  <Text className="text-xl mr-3">{item.icon ?? "📂"}</Text>
                  <Text className="text-base text-text flex-1">{item.name}</Text>
                </Pressable>
                {subs.map((sub) => (
                  <Pressable
                    key={sub.id}
                    className="flex-row items-center pl-12 pr-4 py-2.5 active:bg-card"
                    onPress={() => onSelect(sub)}
                  >
                    <Text className="text-lg mr-3">{sub.icon ?? "📄"}</Text>
                    <Text className="text-sm text-text-secondary">{sub.name}</Text>
                  </Pressable>
                ))}
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
}
