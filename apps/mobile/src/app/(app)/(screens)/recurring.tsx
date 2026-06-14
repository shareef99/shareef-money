import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { ArrowLeft, Repeat, Trash2 } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import {
  useRecurringRules,
  useToggleRecurring,
  useDeleteRecurringRule,
} from "../../../queries/use-recurring";
import { FREQUENCY_LABELS, type Frequency } from "../../../services/recurring-service";
import { getColors } from "../../../lib/colors";

function formatDate(d: Date | number) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecurringScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const { data: rules } = useRecurringRules();
  const toggle = useToggleRecurring();
  const remove = useDeleteRecurringRule();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2">
            Recurring transactions
          </Text>
        </View>

        {rules.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Repeat size={40} color={c.textMuted} strokeWidth={1.5} />
            <Text className="text-base text-text-secondary mt-4 text-center">
              No recurring transactions yet.
            </Text>
            <Text className="text-sm text-text-muted mt-1 text-center">
              Turn on “Repeat” when adding a transaction to schedule it
              automatically.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {rules.map((rule) => {
              const tx = rule.transaction;
              const freq = FREQUENCY_LABELS[rule.frequency as Frequency] ?? rule.frequency;
              const every =
                rule.interval > 1 ? `Every ${rule.interval} · ${freq}` : freq;
              return (
                <View
                  key={rule.id}
                  className="flex-row items-center px-4 py-3.5 border-b border-border"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-base text-text">
                      {tx?.category?.name ?? tx?.note ?? "Transaction"}
                    </Text>
                    <Text className="text-sm text-text-secondary mt-0.5">
                      {tx ? formatCurrency(tx.amount) : "—"} · {every}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {rule.isActive
                        ? `Next: ${formatDate(rule.nextOccurrence)}`
                        : "Paused"}
                      {tx?.account?.name ? ` · ${tx.account.name}` : ""}
                    </Text>
                  </View>
                  <Switch
                    value={rule.isActive}
                    onValueChange={(v) => toggle.mutate({ id: rule.id, isActive: v })}
                    trackColor={{ false: c.border, true: c.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <Pressable
                    className="p-2 ml-1"
                    onPress={() => remove.mutate(rule.id)}
                  >
                    <Trash2 size={18} color={c.textSecondary} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
