import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { DatabaseProvider } from "../../providers/database-provider";
import { SyncProvider } from "../../providers/sync-provider";

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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)/add-transaction"
            options={{ presentation: "modal" }}
          />
        </Stack>
      </SyncProvider>
    </DatabaseProvider>
  );
}
