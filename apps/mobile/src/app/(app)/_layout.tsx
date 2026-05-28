import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../providers/auth-provider";
import { DatabaseProvider } from "../../providers/database-provider";

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
      <Slot />
    </DatabaseProvider>
  );
}
