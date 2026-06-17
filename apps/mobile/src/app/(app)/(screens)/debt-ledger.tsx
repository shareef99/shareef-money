import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useContactDebtEntries } from "../../../queries/use-debts";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

export default function DebtLedgerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string; name?: string }>();
  const contactId = params.contactId ? Number(params.contactId) : null;
  const c = getColors(useColorScheme().colorScheme);

  const { data } = useContactDebtEntries(contactId);
  const name = data.name || params.name || "Person";
  const owesYou = data.net > 0;
  const settled = data.net === 0;

  // Settling clears the balance: if they owe you, you record "You got"; if you
  // owe them, you record "You gave". Prefill the outstanding amount.
  const settleUp = () => {
    if (settled || contactId == null) return;
    router.push({
      pathname: "/add-debt",
      params: {
        type: owesYou ? "debt_borrow" : "debt_lend",
        contactId: String(contactId),
        amount: String(Math.abs(data.net) / 100),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text
            className="text-lg font-semibold text-text ml-2 flex-1"
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>

        <View className="mx-4 my-2 bg-card rounded-xl p-4">
          <Text className="text-sm text-text-secondary mb-1">
            {settled ? "Settled up" : owesYou ? "Owes you" : "You owe"}
          </Text>
          <Text
            className={cn(
              "text-2xl font-bold",
              settled ? "text-text" : owesYou ? "text-income" : "text-expense",
            )}
          >
            {formatCurrency(Math.abs(data.net))}
          </Text>
          {!settled && (
            <Pressable
              className="mt-3 h-10 rounded-lg bg-primary items-center justify-center active:opacity-80"
              onPress={settleUp}
            >
              <Text className="text-sm font-semibold text-primary-foreground">
                Settle up
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {data.entries.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-text-secondary">No entries</Text>
            </View>
          ) : (
            data.entries.map((e) => {
              const gave = e.type === "debt_lend";
              return (
                <Pressable
                  key={e.id}
                  className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                  onPress={() =>
                    router.push({
                      pathname: "/add-debt",
                      params: { id: String(e.id) },
                    })
                  }
                >
                  <View className="flex-1">
                    <Text className="text-sm text-text">
                      {gave ? "You gave" : "You got"}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {e.date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {e.accountName ? ` · ${e.accountName}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={cn(
                        "text-sm font-medium",
                        gave ? "text-expense" : "text-income",
                      )}
                    >
                      {gave ? "-" : "+"}
                      {formatCurrency(e.amount)}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      bal {e.runningBalance < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(e.runningBalance))}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
