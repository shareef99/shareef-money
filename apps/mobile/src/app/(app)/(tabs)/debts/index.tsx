import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useDebtLedger } from "../../../../queries/use-debts";
import { getColors } from "../../../../lib/colors";
import { cn } from "../../../../lib/cn";

export default function DebtsScreen() {
  const router = useRouter();
  const { data } = useDebtLedger();
  const c = getColors(useColorScheme().colorScheme);

  const openAdd = (type: "debt_lend" | "debt_borrow") =>
    router.push({ pathname: "/add-debt", params: { type } });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-xl font-semibold text-text">Debts</Text>
        </View>

        {/* Totals */}
        <View className="mx-4 mb-2 bg-card rounded-xl p-4">
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-text-secondary mb-1">Owed to you</Text>
              <Text className="text-lg font-bold text-income">
                {formatCurrency(data.receivable)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-text-secondary mb-1">You owe</Text>
              <Text className="text-lg font-bold text-expense">
                {formatCurrency(data.payable)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-text-secondary mb-1">Net</Text>
              <Text
                className={cn(
                  "text-lg font-bold",
                  data.net >= 0 ? "text-income" : "text-expense",
                )}
              >
                {data.net < 0 ? "-" : ""}
                {formatCurrency(Math.abs(data.net))}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 px-4 mb-2">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl bg-card border border-border active:opacity-70"
            onPress={() => openAdd("debt_lend")}
          >
            <ArrowUpRight size={18} color={c.expense} />
            <Text className="text-sm font-medium text-text">You gave</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl bg-card border border-border active:opacity-70"
            onPress={() => openAdd("debt_borrow")}
          >
            <ArrowDownLeft size={18} color={c.income} />
            <Text className="text-sm font-medium text-text">You got</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {data.people.length === 0 ? (
            <View className="items-center justify-center py-20 px-8">
              <Text className="text-text-secondary text-base">
                No open debts
              </Text>
              <Text className="text-text-muted text-sm mt-1 text-center">
                Use “You gave” when you lend or pay for someone, “You got” when
                you receive or hold money. Balances settle to zero when repaid.
              </Text>
            </View>
          ) : (
            data.people.map((p) => {
              const owesYou = p.net > 0;
              const dueLabel = p.dueDate
                ? p.overdue
                  ? "Overdue"
                  : `Due ${p.dueDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}`
                : null;
              return (
                <Pressable
                  key={p.contactId}
                  className="flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-card"
                  onPress={() =>
                    router.push({
                      pathname: "/debt-ledger",
                      params: { contactId: String(p.contactId), name: p.name },
                    })
                  }
                >
                  <View className="flex-1">
                    <Text className="text-base text-text">{p.name}</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-xs text-text-muted">
                        {owesYou ? "owes you" : "you owe"}
                      </Text>
                      {dueLabel ? (
                        <Text
                          className={cn(
                            "text-xs ml-2",
                            p.overdue ? "text-expense font-medium" : "text-text-muted",
                          )}
                        >
                          · {dueLabel}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text
                    className={cn(
                      "text-base font-medium",
                      owesYou ? "text-income" : "text-expense",
                    )}
                  >
                    {formatCurrency(Math.abs(p.net))}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
