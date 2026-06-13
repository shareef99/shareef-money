import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { getColors } from "../lib/colors";

type Props = {
  visible: boolean;
  title: string;
  initialAmount?: number; // smallest unit
  onClose: () => void;
  onSubmit: (amount: number) => void; // smallest unit (0 clears)
};

export function AmountInputModal({
  visible,
  title,
  initialAmount,
  onClose,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");
  const { textMuted } = getColors(useColorScheme());

  useEffect(() => {
    if (visible) {
      setValue(initialAmount ? String(initialAmount / 100) : "");
    }
  }, [visible, initialAmount]);

  const handleSubmit = () => {
    onSubmit(Math.round((parseFloat(value) || 0) * 100));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full bg-card rounded-2xl p-5">
          <Text className="text-lg font-semibold text-text mb-4">{title}</Text>
          <TextInput
            className="text-2xl font-bold text-text border-b border-border pb-2 mb-6"
            placeholder="0"
            placeholderTextColor={textMuted}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
          />
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
              <Text className="text-base font-semibold text-primary-foreground">Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
