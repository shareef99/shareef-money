import { Pressable, Text, View } from "react-native";
import type { TransactionType } from "@shareef-money/shared/types";
import { TRANSACTION_TYPE_TABS } from "@shareef-money/shared/constants";
import { cn } from "../lib/cn";
import { TYPE_BORDER, TYPE_TEXT } from "../lib/transaction-type-styles";

type Props = {
  selected: TransactionType;
  onSelect: (type: TransactionType) => void;
};

export function TransactionTypeTabs({ selected, onSelect }: Props) {
  return (
    <View className="flex-row gap-3">
      {TRANSACTION_TYPE_TABS.map(({ type, label }) => (
        <Pressable
          key={type}
          className={cn(
            "flex-1 py-2 items-center rounded-lg border",
            selected === type ? TYPE_BORDER[type] : "bg-card border-border",
          )}
          onPress={() => onSelect(type)}
        >
          <Text
            className={cn(
              "text-sm font-medium",
              selected === type ? TYPE_TEXT[type] : "text-text",
            )}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
