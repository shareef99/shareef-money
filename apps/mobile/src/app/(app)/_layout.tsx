import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { setActiveCurrency } from "@shareef-money/shared/utils";
import { useAuth } from "../../providers/auth-provider";
import { DatabaseProvider } from "../../providers/database-provider";
import { SyncProvider } from "../../providers/sync-provider";
import { RestoreProvider } from "../../providers/restore-provider";
import { useSettings } from "../../queries/use-settings";

// Inside the providers so it can read settings. Keying the navigator by the
// active currency cleanly remounts every screen when the user changes it, so
// all formatCurrency() displays pick up the new symbol at once (a set-once
// action — far simpler than threading reactivity through ~30 call sites).
function AppStack() {
  const { data: settings } = useSettings();
  // Set the global formatter synchronously, before the keyed subtree below
  // renders, so even the first paint after a remount uses the right symbol.
  setActiveCurrency(settings.currencyCode);
  return (
    <Stack
      key={settings.currencyCode}
      screenOptions={{
        headerShown: false,
        // Transparent scenes let ThemedRoot's themed background show behind
        // the status bar (default scene bg is opaque white).
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function AppLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <DatabaseProvider>
      <SyncProvider>
        <RestoreProvider>
          <AppStack />
        </RestoreProvider>
      </SyncProvider>
    </DatabaseProvider>
  );
}
