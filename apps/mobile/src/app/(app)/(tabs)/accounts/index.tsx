import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountsScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold text-text">Accounts</Text>
        <Text className="text-sm text-text-secondary mt-1">Coming soon</Text>
      </SafeAreaView>
    </View>
  );
}
