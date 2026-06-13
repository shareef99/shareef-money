import type { ReactNode } from "react";
import { View } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { lightVars, darkVars } from "../lib/theme-vars";

type Props = {
  children: ReactNode;
};

// Injects the active theme's CSS variables so every `bg-background`,
// `text-text`, etc. token resolves against them. Switching the scheme via
// NativeWind's setColorScheme re-renders this with the other var set.
export function ThemedRoot({ children }: Props) {
  const { colorScheme } = useColorScheme();
  const themeVars = colorScheme === "dark" ? darkVars : lightVars;

  return (
    <View style={vars(themeVars)} className="flex-1">
      {children}
    </View>
  );
}
