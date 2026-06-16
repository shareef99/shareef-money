import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { getColors } from "../../../lib/colors";

export default function ModalsLayout() {
  const c = getColors(useColorScheme());
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
        // Opaque themed background (a modal must not show the screen behind it),
        // which also fills behind the status bar.
        contentStyle: { backgroundColor: c.background },
      }}
    />
  );
}
