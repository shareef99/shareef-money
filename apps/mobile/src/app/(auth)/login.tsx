import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "@tanstack/react-form";
import { loginSchema } from "@shareef-money/shared/validation";
import { useAuth } from "../../providers/auth-provider";
import { parseError } from "@shareef-money/shared/utils";

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        await login(value.email, value.password);
      } catch (e) {
        setSubmitError(parseError(e, "Login failed"));
      }
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-semibold text-text mb-8">Sign In</Text>

        {submitError ? (
          <Text className="text-error text-sm mb-4">{submitError}</Text>
        ) : null}

        <View className="gap-5 mb-8">
          <form.Field name="email">
            {(field) => (
              <View>
                <Text className="text-xs text-text-secondary mb-1">Email</Text>
                <TextInput
                  className="h-12 border-b border-border text-text text-base"
                  placeholder="your@email.com"
                  placeholderTextColor="#A1A1AA"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 ? (
                  <Text className="text-error text-xs mt-1">
                    {field.state.meta.errors[0]?.message}
                  </Text>
                ) : null}
              </View>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <View>
                <Text className="text-xs text-text-secondary mb-1">
                  Password
                </Text>
                <TextInput
                  className="h-12 border-b border-border text-text text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#A1A1AA"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  secureTextEntry
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 ? (
                  <Text className="text-error text-xs mt-1">
                    {field.state.meta.errors[0]?.message}
                  </Text>
                ) : null}
              </View>
            )}
          </form.Field>
        </View>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Pressable
              className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
              onPress={form.handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <Text className="text-primary-foreground font-semibold text-base">
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          )}
        </form.Subscribe>
      </View>
    </SafeAreaView>
  );
}
