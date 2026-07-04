import { useEffect, useState } from "react";
import { Modal, Pressable, Switch, Text, TextInput, View, useColorScheme } from "react-native";
import { getColors } from "../lib/colors";
import { useKeyboardHeight } from "../lib/use-keyboard-height";
import { ColorPicker, DEFAULT_PICKER_COLOR } from "./color-picker";

type Values = {
  name: string;
  initialBalance: number;
  description: string | null;
  color: string;
  isHidden: boolean;
};

type Props = {
  visible: boolean;
  title: string;
  initialName?: string;
  initialBalance?: number;
  initialDescription?: string | null;
  initialColor?: string | null;
  initialHidden?: boolean;
  // Show the "hidden account" toggle (only meaningful on edit).
  showHideToggle?: boolean;
  // Show the initial-balance field. Only meaningful when ADDING: the amount is
  // recorded as an opening-balance income entry. On edit the stored
  // initialBalance is always 0 (balance is derived from that income), so editing
  // this field would double-count — callers editing an account pass false.
  showBalance?: boolean;
  onClose: () => void;
  onSubmit: (values: Values) => void;
};

export function AccountFormModal({
  visible,
  title,
  initialName,
  initialBalance,
  initialDescription,
  initialColor,
  initialHidden,
  showHideToggle,
  showBalance = true,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_PICKER_COLOR);
  const [hidden, setHidden] = useState(false);
  const kbHeight = useKeyboardHeight();
  const colors = getColors(useColorScheme());

  useEffect(() => {
    if (visible) {
      setName(initialName ?? "");
      setBalance(initialBalance != null ? String(initialBalance / 100) : "");
      setDescription(initialDescription ?? "");
      setColor(initialColor ?? DEFAULT_PICKER_COLOR);
      setHidden(initialHidden ?? false);
    }
  }, [visible, initialName, initialBalance, initialDescription, initialColor, initialHidden]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsed = Math.round((parseFloat(balance) || 0) * 100);
    onSubmit({
      name: trimmed,
      initialBalance: parsed,
      description: description.trim() || null,
      color,
      isHidden: hidden,
    });
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
            placeholder="e.g. Cash, Bank, Card"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {showBalance && (
            <>
              <Text className="text-xs text-text-secondary mb-1">Initial balance</Text>
              <TextInput
                className="text-base text-text border-b border-border pb-1"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={balance}
                onChangeText={setBalance}
                keyboardType="numeric"
              />
              <Text className="text-[11px] text-text-muted mb-4">
                Recorded as an “Opening Balance” income entry.
              </Text>
            </>
          )}

          <Text className="text-xs text-text-secondary mb-1">Description (optional)</Text>
          <TextInput
            className="text-base text-text border-b border-border pb-2 mb-4"
            placeholder=""
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Text className="text-xs text-text-secondary mb-2">Color</Text>
          <View className="mb-4">
            <ColorPicker value={color} onChange={setColor} />
          </View>

          {showHideToggle && (
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1 pr-3">
                <Text className="text-base text-text">Hide account</Text>
                <Text className="text-[11px] text-text-muted mt-0.5">
                  Excluded from Total Assets and the account picker. Its
                  transactions are kept.
                </Text>
              </View>
              <Switch
                value={hidden}
                onValueChange={setHidden}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

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
