import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full bg-card rounded-2xl p-5">
          <Text className="text-lg font-semibold text-text mb-2">{title}</Text>
          <Text className="text-sm text-text-secondary mb-6">{message}</Text>

          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 h-11 items-center justify-center rounded-lg border border-border active:opacity-70"
              onPress={onCancel}
            >
              <Text className="text-base text-text">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-1 h-11 items-center justify-center rounded-lg bg-error active:opacity-80"
              onPress={onConfirm}
            >
              <Text className="text-base font-semibold text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
