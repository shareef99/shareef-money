import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { getColors } from "../lib/colors";

type Props = {
  visible: boolean;
  title: string;
  initialName?: string;
  initialBalance?: number;
  initialDescription?: string | null;
  onClose: () => void;
  onSubmit: (values: { name: string; initialBalance: number; description: string | null }) => void;
};

export function AccountFormModal({
  visible,
  title,
  initialName,
  initialBalance,
  initialDescription,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  const { textMuted } = getColors(useColorScheme());

  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
      setBalance(
        initialBalance != null ? String(initialBalance / 100) : "",
      );
      setDescription(initialDescription ?? "");
    }
  }, [visible, initialName, initialBalance, initialDescription]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsed = Math.round((parseFloat(balance) || 0) * 100);
    onSubmit({
      name: trimmed,
      initialBalance: parsed,
      description: description.trim() || null,
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full bg-card rounded-2xl p-5">
          <Text className="text-lg font-semibold text-text mb-4">{title}</Text>

          <Text className="text-xs text-text-secondary mb-1">Name</Text>
          <TextInput
            className="text-base text-text border-b border-border pb-2 mb-4"
            placeholder="e.g. Cash, Bank, Card"
            placeholderTextColor={textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text className="text-xs text-text-secondary mb-1">Initial balance</Text>
          <TextInput
            className="text-base text-text border-b border-border pb-2 mb-4"
            placeholder="0"
            placeholderTextColor={textMuted}
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
          />

          <Text className="text-xs text-text-secondary mb-1">Description (optional)</Text>
          <TextInput
            className="text-base text-text border-b border-border pb-2 mb-6"
            placeholder=""
            placeholderTextColor={textMuted}
            value={description}
            onChangeText={setDescription}
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
