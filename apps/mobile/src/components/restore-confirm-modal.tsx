import { Modal, Pressable, Text, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";

type Props = {
  visible: boolean;
  // Backup creation time, for "from <date>" context.
  exportedAt?: number;
  // True while the pre-restore backup export is running.
  backingUp?: boolean;
  onBackupFirst: () => void;
  onReplace: () => void;
  onCancel: () => void;
};

export function RestoreConfirmModal({
  visible,
  exportedAt,
  backingUp,
  onBackupFirst,
  onReplace,
  onCancel,
}: Props) {
  const when = exportedAt
    ? new Date(exportedAt).toLocaleString()
    : "the selected file";

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full bg-card rounded-2xl p-5">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={20} color="#E5484D" />
            <Text className="text-lg font-semibold text-text ml-2">
              Replace all data?
            </Text>
          </View>
          <Text className="text-sm text-text-secondary mb-5">
            Restoring will permanently delete all your current accounts,
            transactions, budgets and settings, and replace them with the backup
            from {when}. This can&apos;t be undone.
          </Text>

          <Pressable
            className="h-11 items-center justify-center rounded-lg border border-border mb-2 active:opacity-70"
            onPress={onBackupFirst}
            disabled={backingUp}
          >
            <Text className="text-base text-primary">
              {backingUp ? "Preparing backup…" : "Back up current data first"}
            </Text>
          </Pressable>
          <Pressable
            className="h-11 items-center justify-center rounded-lg bg-error mb-2 active:opacity-80"
            onPress={onReplace}
            disabled={backingUp}
          >
            <Text className="text-base font-semibold text-white">
              Replace all data
            </Text>
          </Pressable>
          <Pressable
            className="h-11 items-center justify-center rounded-lg active:opacity-70"
            onPress={onCancel}
            disabled={backingUp}
          >
            <Text className="text-base text-text-secondary">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
