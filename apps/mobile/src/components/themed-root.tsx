import type { ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";

type Props = {
  children: ReactNode;
};

// Theming itself is handled by the @media(prefers-color-scheme) block in
// global.css (NativeWind applies it globally to every screen). Here we only
// keep the status bar in sync with the same color scheme: dark theme → light
// (white) icons, light theme → dark icons.
export function ThemedRoot({ children }: Props) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-background">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
