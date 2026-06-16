import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { Check, Plus, X } from "lucide-react-native";
import type { Location } from "@shareef-money/db/schema";
import { getColors } from "../lib/colors";
import { cn } from "../lib/cn";

type Props = {
  visible: boolean;
  locations: Location[];
  selectedId: number | null;
  onClose: () => void;
  onSelect: (location: Location | null) => void;
  onCreate: (name: string) => void;
};

export function LocationPicker({
  visible,
  locations,
  selectedId,
  onClose,
  onSelect,
  onCreate,
}: Props) {
  const [newName, setNewName] = useState("");
  const c = getColors(useColorScheme());

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="h-1/2 bg-background rounded-t-2xl">
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold text-text flex-1">Location</Text>
            <Pressable onPress={onClose} className="p-1">
              <X size={24} color={c.textSecondary} />
            </Pressable>
          </View>

          <View className="flex-row items-center px-4 py-2 border-b border-border">
            <TextInput
              className="flex-1 text-base text-text py-1"
              placeholder="Add a location"
              placeholderTextColor={c.textMuted}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable onPress={handleAdd} className="p-1">
              <Plus size={22} color={c.primary} />
            </Pressable>
          </View>

          <FlatList
            data={locations}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <Pressable
                className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                onPress={() => onSelect(null)}
              >
                <Text className="text-base text-text-secondary flex-1">None</Text>
                {selectedId == null && <Check size={18} color={c.primary} />}
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                onPress={() => onSelect(item)}
              >
                <Text
                  className={cn(
                    "text-base flex-1",
                    item.id === selectedId ? "text-primary font-medium" : "text-text",
                  )}
                >
                  {item.name}
                </Text>
                {item.id === selectedId && <Check size={18} color={c.primary} />}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
