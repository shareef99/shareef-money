import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleAuth } from "../../hooks/use-google-auth";

export default function WelcomeScreen() {
  const router = useRouter();
  const { promptGoogleLogin, isReady } = useGoogleAuth();

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

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-text-muted text-xs">OR</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <Pressable
            className="h-12 bg-card border border-border flex-row items-center justify-center rounded-lg gap-2 active:opacity-80"
            onPress={() => promptGoogleLogin()}
            disabled={!isReady}
          >
            <Text className="text-lg">G</Text>
            <Text className="text-text font-semibold text-base">
              Continue with Google
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
