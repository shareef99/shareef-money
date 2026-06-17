import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import {
  useAccountsWithBalances,
  useCreateAccount,
} from "../../../../queries/use-accounts";
import { useNetWorth } from "../../../../queries/use-debts";
import { AccountFormModal } from "../../../../components/account-form-modal";
import { getColors } from "../../../../lib/colors";
import { cn } from "../../../../lib/cn";

export default function AccountsScreen() {
  const router = useRouter();
  const { data } = useAccountsWithBalances();
  const { data: nw } = useNetWorth();
  const createAccount = useCreateAccount();
  const [showAdd, setShowAdd] = useState(false);
  const c = getColors(useColorScheme().colorScheme);
  const hasDebts = nw.receivable > 0 || nw.payable > 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-xl font-semibold text-text">Accounts</Text>
          <Pressable onPress={() => setShowAdd(true)} className="p-2 -mr-2">
            <Plus size={24} color={c.text} />
          </Pressable>
        </View>

        <View className="mx-4 mb-2 bg-card rounded-xl p-4">
          <Text className="text-sm text-text-secondary mb-1">Net worth</Text>
          <Text
            className={cn(
              "text-2xl font-bold",
              nw.netWorth >= 0 ? "text-text" : "text-expense",
            )}
          >
            {nw.netWorth < 0 ? "-" : ""}
            {formatCurrency(Math.abs(nw.netWorth))}
          </Text>
          {hasDebts ? (
            <View className="flex-row mt-3 pt-3 border-t border-border">
              <View className="flex-1">
                <Text className="text-xs text-text-secondary mb-0.5">
                  In accounts
                </Text>
                <Text className="text-sm font-medium text-text">
                  {data.total < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(data.total))}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-secondary mb-0.5">
                  Owed to you
                </Text>
                <Text className="text-sm font-medium text-income">
                  {formatCurrency(nw.receivable)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-secondary mb-0.5">
                  You owe
                </Text>
                <Text className="text-sm font-medium text-expense">
                  {formatCurrency(nw.payable)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {data.accounts.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-text-secondary text-base">No accounts yet</Text>
              <Text className="text-text-muted text-sm mt-1">
                Tap + to add an account
              </Text>
            </View>
          ) : (
            data.accounts.map((account) => (
              <Pressable
                key={account.id}
                className={cn(
                  "flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-card",
                  account.isHidden && "opacity-50",
                )}
                onPress={() =>
                  router.push({
                    pathname: "/account-detail",
                    params: { id: String(account.id) },
                  })
                }
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: account.color ?? c.textMuted }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-base text-text">{account.name}</Text>
                      {account.isHidden ? (
                        <Text className="text-[10px] text-text-muted ml-2 px-1.5 py-0.5 rounded bg-card">
                          Hidden
                        </Text>
                      ) : null}
                    </View>
                    {account.description ? (
                      <Text className="text-xs text-text-muted mt-0.5">
                        {account.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text
                  className={cn(
                    "text-base font-medium",
                    account.balance >= 0 ? "text-text" : "text-expense",
                  )}
                >
                  {account.balance < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(account.balance))}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <AccountFormModal
          visible={showAdd}
          title="Add Account"
          onClose={() => setShowAdd(false)}
          onSubmit={(values) => {
            createAccount.mutate({
              name: values.name,
              initialBalance: values.initialBalance,
              description: values.description,
              color: values.color,
            });
            setShowAdd(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
