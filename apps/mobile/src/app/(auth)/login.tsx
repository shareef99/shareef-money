import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/auth-provider";

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-semibold text-text mb-8">Sign In</Text>

        {error ? (
          <Text className="text-error text-sm mb-4">{error}</Text>
        ) : null}

        <View className="gap-5 mb-8">
          <View>
            <Text className="text-xs text-text-secondary mb-1">Email</Text>
            <TextInput
              className="h-12 border-b border-border text-text text-base"
              placeholder="your@email.com"
              placeholderTextColor="#A1A1AA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text className="text-xs text-text-secondary mb-1">Password</Text>
            <TextInput
              className="h-12 border-b border-border text-text text-base"
              placeholder="Enter your password"
              placeholderTextColor="#A1A1AA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <Pressable
          className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {isLoading ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
