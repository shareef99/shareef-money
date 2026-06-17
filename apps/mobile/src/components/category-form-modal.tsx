import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { getColors } from "../lib/colors";
import { useKeyboardHeight } from "../lib/use-keyboard-height";
import { ColorPicker, DEFAULT_PICKER_COLOR } from "./color-picker";

type Props = {
  visible: boolean;
  title: string;
  initialName?: string;
  initialColor?: string | null;
  onClose: () => void;
  onSubmit: (values: { name: string; color: string }) => void;
};

export function CategoryFormModal({
  visible,
  title,
  initialName,
  initialColor,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_PICKER_COLOR);
  const kbHeight = useKeyboardHeight();
  const { textMuted } = getColors(useColorScheme());

  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
      setColor(initialColor ?? DEFAULT_PICKER_COLOR);
    }
  }, [visible, initialName, initialColor]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, color });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        className="flex-1 bg-black/60 items-center justify-center px-6"
        style={{ paddingBottom: kbHeight }}
      >
        <View className="w-full bg-card rounded-2xl p-5">
          <Text className="text-lg font-semibold text-text mb-4">{title}</Text>

          <Text className="text-xs text-text-secondary mb-1">Name</Text>
          <TextInput
            className="text-base text-text border-b border-border pb-2 mb-4"
            placeholder="Category name"
            placeholderTextColor={textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text className="text-xs text-text-secondary mb-2">Color</Text>
          <View className="mb-6">
            <ColorPicker value={color} onChange={setColor} />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 h-11 items-center justify-center rounded-lg border border-border active:opacity-70"
              onPress={onClose}
            >
              <Text className="text-base text-text">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-1 h-11 items-center justify-center rounded-lg bg-primary active:opacity-80"
              onPress={handleSubmit}
            >
              <Text className="text-base font-semibold text-primary-foreground">
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
