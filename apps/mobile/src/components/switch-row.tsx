import { Switch, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { getColors } from "../lib/colors";

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

// A labelled settings toggle row. Lives in its own file so it isn't redefined
// on every render of the Configuration screen — an inline component would get a
// new identity each render and remount the Switch.
export function SwitchRow({ label, description, value, onValueChange }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  return (
    <View className="flex-row items-center px-4 py-3.5 border-b border-border">
      <View className="flex-1 pr-3">
        <Text className="text-base text-text">{label}</Text>
        {description ? (
          <Text className="text-xs text-text-muted mt-0.5">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
