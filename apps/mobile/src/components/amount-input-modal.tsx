import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { getColors } from "../lib/colors";
import { useKeyboardHeight } from "../lib/use-keyboard-height";
import { cn } from "../lib/cn";

type Props = {
  visible: boolean;
  title: string;
  initialAmount?: number; // smallest unit
  // When set, shows a "this month / all months" scope toggle and passes the
  // chosen scope to onSubmit.
  monthLabel?: string;
  onClose: () => void;
  onSubmit: (amount: number, applyToAll: boolean) => void; // smallest unit (0 clears)
};

export function AmountInputModal({
  visible,
  title,
  initialAmount,
  monthLabel,
  onClose,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");
  const [applyToAll, setApplyToAll] = useState(true);
  const kbHeight = useKeyboardHeight();
  const { textMuted } = getColors(useColorScheme());

  useEffect(() => {
    if (visible) {
      setValue(initialAmount ? String(initialAmount / 100) : "");
      setApplyToAll(true);
    }
  }, [visible, initialAmount]);

  const handleSubmit = () => {
    onSubmit(Math.round((parseFloat(value) || 0) * 100), applyToAll);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        className="flex-1 bg-black/60 items-center justify-center px-6"
        style={{ paddingBottom: kbHeight }}
      >
        <View className="w-full bg-card rounded-2xl p-5">
          <Text className="text-lg font-semibold text-text mb-4">{title}</Text>
          <TextInput
            className="text-2xl font-bold text-text border-b border-border pb-2 mb-4"
            placeholder="0"
            placeholderTextColor={textMuted}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
          />
          {monthLabel ? (
            <View className="flex-row gap-2 mb-5">
              {[
                { all: true, label: "All months" },
                { all: false, label: monthLabel },
              ].map((opt) => (
                <Pressable
                  key={String(opt.all)}
                  className={cn(
                    "flex-1 py-2 items-center rounded-lg border",
                    applyToAll === opt.all
                      ? "bg-primary border-primary"
                      : "bg-surface border-border",
                  )}
                  onPress={() => setApplyToAll(opt.all)}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      applyToAll === opt.all
                        ? "text-primary-foreground"
                        : "text-text-secondary",
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
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
