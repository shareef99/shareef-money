import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { registerSchema } from "@shareef-money/shared/validation";
import { useAuth } from "../../providers/auth-provider";
import { parseError } from "@shareef-money/shared/utils";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validatorAdapter: zodValidator(),
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        await register(value.name, value.email, value.password);
      } catch (e) {
        setSubmitError(parseError(e, "Registration failed"));
      }
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-semibold text-text mb-8">
          Create Account
        </Text>

        {submitError ? (
          <Text className="text-error text-sm mb-4">{submitError}</Text>
        ) : null}

        <View className="gap-5 mb-8">
          <form.Field name="name">
            {(field) => (
              <View>
                <Text className="text-xs text-text-secondary mb-1">Name</Text>
                <TextInput
                  className="h-12 border-b border-border text-text text-base"
                  placeholder="Your name"
                  placeholderTextColor="#A1A1AA"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCapitalize="words"
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                  <Text className="text-error text-xs mt-1">
                    {field.state.meta.errors[0]?.message}
                  </Text>
                ) : null}
              </View>
            )}
          </form.Field>

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
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
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
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#A1A1AA"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  secureTextEntry
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                  <Text className="text-error text-xs mt-1">
                    {field.state.meta.errors[0]?.message}
                  </Text>
                ) : null}
              </View>
            )}
          </form.Field>
        </View>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Pressable
              className="h-12 bg-primary items-center justify-center rounded-lg active:opacity-80"
              onPress={form.handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <Text className="text-primary-foreground font-semibold text-base">
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Text>
            </Pressable>
          )}
        </form.Subscribe>
      </View>
    </SafeAreaView>
  );
}
