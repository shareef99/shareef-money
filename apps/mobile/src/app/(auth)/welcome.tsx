import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../providers/auth-provider";

export default function WelcomeScreen() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <View className="items-center gap-3 mb-16">
          <Text className="text-4xl font-bold text-text">Shareef Money</Text>
          <Text className="text-base text-text-secondary text-center">
            Track your income, expenses, and transfers
          </Text>
        </View>

        <View className="w-full gap-3">
          <Pressable
            className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
            onPress={() => setShowLogin(true)}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Sign In
            </Text>
          </Pressable>

          <Pressable
            className="h-12 bg-card border border-border items-center justify-center rounded-lg active:opacity-80"
            onPress={() => setShowRegister(true)}
          >
            <Text className="text-text font-semibold text-base">
              Create Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <LoginSheet visible={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterSheet
        visible={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </View>
  );
}

function LoginSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-surface rounded-t-2xl px-4 pt-2 pb-8">
          <View className="w-9 h-1 bg-text-muted rounded-full self-center mb-6" />

          <Text className="text-2xl font-semibold text-text mb-6">
            Sign In
          </Text>

          {error ? (
            <Text className="text-error text-sm mb-4">{error}</Text>
          ) : null}

          <View className="gap-4 mb-6">
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
              <Text className="text-xs text-text-secondary mb-1">
                Password
              </Text>
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
      </View>
    </Modal>
  );
}

function RegisterSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-surface rounded-t-2xl px-4 pt-2 pb-8">
          <View className="w-9 h-1 bg-text-muted rounded-full self-center mb-6" />

          <Text className="text-2xl font-semibold text-text mb-6">
            Create Account
          </Text>

          {error ? (
            <Text className="text-error text-sm mb-4">{error}</Text>
          ) : null}

          <View className="gap-4 mb-6">
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
              <Text className="text-xs text-text-secondary mb-1">
                Password
              </Text>
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
      </View>
    </Modal>
  );
}
