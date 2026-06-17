import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { ChevronRight, Pencil, X } from "lucide-react-native";
import type { Category } from "@shareef-money/db/schema";
import { getColors } from "../lib/colors";
import { cn } from "../lib/cn";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  onEdit?: () => void;
  categories: Category[];
  title?: string;
};

export function CategoryPicker({
  visible,
  onClose,
  onSelect,
  onEdit,
  categories,
  title = "Category",
}: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) setActiveParentId(null);
  }, [visible]);

  const parents = categories.filter((c) => !c.parentId);
  const activeParent = parents.find((c) => c.id === activeParentId) ?? null;
  const subcategories = activeParent
    ? categories.filter((c) => c.parentId === activeParent.id)
    : [];

  // Hardware back: step out of the subcategory pane first, then close
  const handleBack = () => {
    if (activeParentId !== null) {
      setActiveParentId(null);
    } else {
      onClose();
    }
  };

  const handleParentPress = (parent: Category) => {
    const hasSubs = categories.some((c) => c.parentId === parent.id);
    if (hasSubs) {
      setActiveParentId(parent.id);
    } else {
      onSelect(parent);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleBack}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="h-1/2 bg-background rounded-t-2xl">
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold text-text flex-1">
              {title}
            </Text>
            {onEdit && (
              <Pressable onPress={onEdit} className="p-1 mr-3">
                <Pencil size={20} color={c.textSecondary} />
              </Pressable>
            )}
            <Pressable onPress={onClose} className="p-1">
              <X size={24} color={c.textSecondary} />
            </Pressable>
          </View>

          <View className="flex-1 flex-row">
            <FlatList
              className="flex-1"
              data={parents}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const hasSubs = categories.some((c) => c.parentId === item.id);
                const isActive = item.id === activeParentId;
                return (
                  <Pressable
                    className={cn(
                      "flex-row items-center px-4 py-3 border-b border-border active:bg-card",
                      isActive && "bg-card",
                    )}
                    onPress={() => handleParentPress(item)}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{ backgroundColor: item.color ?? c.textMuted }}
                    />
                    <Text
                      className={cn(
                        "text-base flex-1",
                        isActive ? "text-primary font-medium" : "text-text",
                      )}
                    >
                      {item.name}
                    </Text>
                    {hasSubs && (
                      <ChevronRight size={16} color={c.textSecondary} />
                    )}
                  </Pressable>
                );
              }}
            />

            {activeParent && (
              <FlatList
                className="flex-1 border-l border-border"
                data={[activeParent, ...subcategories]}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                    onPress={() => onSelect(item)}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{ backgroundColor: item.color ?? c.textMuted }}
                    />
                    <Text className="text-base text-text">{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
