import { Pressable, Text, View } from "react-native";
import type { TransactionType } from "@shareef-money/shared/types";
import { TRANSACTION_TYPE_TABS } from "@shareef-money/shared/constants";
import { cn } from "../lib/cn";

type Props = {
  selected: TransactionType;
  onSelect: (type: TransactionType) => void;
};

export function TransactionTypeTabs({ selected, onSelect }: Props) {
  return (
    <View className="flex-row bg-card rounded-lg p-1">
      {TRANSACTION_TYPE_TABS.map(({ type, label }) => (
        <Pressable
          key={type}
          className={cn(
            "flex-1 py-2 items-center rounded-md",
            selected === type && "bg-primary",
          )}
          onPress={() => onSelect(type)}
        >
          <Text
            className={cn(
              "text-sm font-medium",
              selected === type ? "text-primary-foreground" : "text-text-secondary",
            )}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
