import { Pressable, Text, View, useColorScheme } from "react-native";
import { Delete } from "lucide-react-native";
import { getColors } from "../lib/colors";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
};

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "backspace"],
];

export function NumericKeypad({ value, onChange, onDone }: Props) {
  const c = getColors(useColorScheme());
  const handlePress = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === ".") {
      if (value.includes(".")) return;
      if (value === "") {
        onChange("0.");
        return;
      }
      onChange(value + ".");
      return;
    }

    if (value === "0" && key !== ".") {
      onChange(key);
      return;
    }

    const parts = value.split(".");
    if (parts[1] && parts[1].length >= 2) return;

    onChange(value + key);
  };

  return (
    <View className="bg-surface border-t border-border pt-2 pb-4 px-4">
      {KEYS.map((row, i) => (
        <View key={i} className="flex-row mb-1">
          {row.map((key) => (
            <Pressable
              key={key}
              className="flex-1 h-14 items-center justify-center mx-1 rounded-lg active:bg-card"
              onPress={() => handlePress(key)}
            >
              {key === "backspace" ? (
                <Delete size={24} color={c.text} />
              ) : (
                <Text className="text-xl font-medium text-text">{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
      <Pressable
        className="h-12 items-center justify-center bg-primary rounded-lg mt-1 mx-1"
        onPress={onDone}
      >
        <Text className="text-base font-semibold text-primary-foreground">
          Done
        </Text>
      </Pressable>
    </View>
  );
}
