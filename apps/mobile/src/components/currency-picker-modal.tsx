import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { CURRENCIES } from "@shareef-money/shared/utils";

type Props = {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CurrencyPickerModal({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-card rounded-t-2xl max-h-[70%]" onPress={() => {}}>
          <View className="px-5 pt-4 pb-2">
            <Text className="text-lg font-semibold text-text">Currency</Text>
            <Text className="text-xs text-text-muted mt-0.5">
              Changes the symbol shown everywhere. Your amounts are not converted.
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {CURRENCIES.map((cur) => {
              const active = cur.code === selectedCode;
              return (
                <Pressable
                  key={cur.code}
                  className="flex-row items-center px-5 py-3.5 border-b border-border active:bg-background"
                  onPress={() => onSelect(cur.code)}
                >
                  <Text className="text-base text-text w-10">{cur.symbol}</Text>
                  <View className="flex-1">
                    <Text className="text-base text-text">{cur.name}</Text>
                    <Text className="text-xs text-text-muted">{cur.code}</Text>
                  </View>
                  {active ? <Check size={20} color="#208AEF" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
