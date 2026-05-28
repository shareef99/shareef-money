import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../../../providers/auth-provider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MoreScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-4 pt-4">
        <Text className="text-xl font-semibold text-text mb-6">Settings</Text>

        <View className="bg-card rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-text">
            {user?.name}
          </Text>
          <Text className="text-sm text-text-secondary">{user?.email}</Text>
        </View>

        <Pressable
          className="h-12 bg-error items-center justify-center rounded-lg active:opacity-80"
          onPress={logout}
        >
          <Text className="text-white font-semibold text-base">Logout</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
