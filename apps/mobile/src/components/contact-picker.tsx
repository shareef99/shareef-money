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
import type { Contact } from "@shareef-money/db/schema";
import { getColors } from "../lib/colors";
import { useKeyboardHeight } from "../lib/use-keyboard-height";
import { cn } from "../lib/cn";

type Props = {
  visible: boolean;
  contacts: Contact[];
  selectedIds: number[];
  onClose: () => void;
  onToggle: (id: number) => void;
  onCreate: (name: string) => void;
};

export function ContactPicker({
  visible,
  contacts,
  selectedIds,
  onClose,
  onToggle,
  onCreate,
}: Props) {
  const [newName, setNewName] = useState("");
  const kbHeight = useKeyboardHeight();
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
        <View
          className="h-1/2 bg-background rounded-t-2xl"
          style={{ marginBottom: kbHeight }}
        >
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold text-text flex-1">People</Text>
            <Pressable onPress={onClose} className="px-2 py-1">
              <Text className="text-base font-medium text-primary">Done</Text>
            </Pressable>
            <Pressable onPress={onClose} className="p-1 ml-1">
              <X size={24} color={c.textSecondary} />
            </Pressable>
          </View>

          <View className="flex-row items-center px-4 py-2 border-b border-border">
            <TextInput
              className="flex-1 text-base text-text py-1"
              placeholder="Add a person"
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
            data={contacts}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-text-muted text-sm">
                  No people yet — add one above
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable
                  className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                  onPress={() => onToggle(item.id)}
                >
                  <Text
                    className={cn(
                      "text-base flex-1",
                      selected ? "text-primary font-medium" : "text-text",
                    )}
                  >
                    {item.name}
                  </Text>
                  {selected && <Check size={18} color={c.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
