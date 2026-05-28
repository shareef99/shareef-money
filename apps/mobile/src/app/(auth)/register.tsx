import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/auth-provider";

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    try {
      await register(name, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-semibold text-text mb-8">
          Create Account
        </Text>

        {error ? (
          <Text className="text-error text-sm mb-4">{error}</Text>
        ) : null}

        <View className="gap-5 mb-8">
          <View>
            <Text className="text-xs text-text-secondary mb-1">Name</Text>
            <TextInput
              className="h-12 border-b border-border text-text text-base"
              placeholder="Your name"
              placeholderTextColor="#A1A1AA"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Min. 8 characters"
              placeholderTextColor="#A1A1AA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <Pressable
          className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {isLoading ? "Creating account..." : "Create Account"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
