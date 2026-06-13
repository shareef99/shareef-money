import "../../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../providers/auth-provider";
import { ThemedRoot } from "../components/themed-root";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <ThemedRoot>
            <StatusBar style="auto" />
            <Slot />
          </ThemedRoot>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
