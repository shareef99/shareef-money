import { Redirect } from "expo-router";
import { useAuth } from "../providers/auth-provider";
import { ActivityIndicator, View } from "react-native";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/transactions" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
