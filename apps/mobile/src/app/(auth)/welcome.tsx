import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="items-center gap-3 mb-16">
          <Text className="text-4xl font-bold text-text">Shareef Money</Text>
          <Text className="text-base text-text-secondary text-center">
            Track your income, expenses, and transfers
          </Text>
        </View>

        <View className="gap-3">
          <Pressable
            className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
            onPress={() => router.push("/(auth)/login")}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Sign In
            </Text>
          </Pressable>

          <Pressable
            className="h-12 bg-card border border-border items-center justify-center rounded-lg active:opacity-80"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text className="text-text font-semibold text-base">
              Create Account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
