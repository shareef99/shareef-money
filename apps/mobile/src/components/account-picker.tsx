import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { X } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { Account } from "@shareef-money/db/schema";
import { getColors } from "../lib/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  accounts: Account[];
  title?: string;
};

export function AccountPicker({
  visible,
  onClose,
  onSelect,
  accounts,
  title = "Select Account",
}: Props) {
  const c = getColors(useColorScheme().colorScheme);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="h-1/2 bg-background rounded-t-2xl">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold text-text">{title}</Text>
            <Pressable onPress={onClose} className="p-1">
              <X size={24} color={c.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={accounts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center justify-between px-4 py-3 active:bg-card"
                onPress={() => onSelect(item)}
              >
                <Text className="text-base text-text">{item.name}</Text>
                <Text className="text-sm text-text-secondary">
                  {formatCurrency(item.initialBalance)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
