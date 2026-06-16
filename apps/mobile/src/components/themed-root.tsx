import type { ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { StatusBar } from "expo-status-bar";

type Props = {
  children: ReactNode;
};

// Theming itself is handled by the @media(prefers-color-scheme) block in
// global.css (NativeWind applies it globally to every screen). Here we keep the
// status bar icons in sync with the scheme (dark theme → light icons). The
// themed background fills behind the status bar; navigator scenes are made
// transparent (see the Stack/Tabs layouts) so this shows through everywhere.
export function ThemedRoot({ children }: Props) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 bg-background">
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
