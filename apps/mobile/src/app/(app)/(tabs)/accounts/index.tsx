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
import { AccountFormModal } from "../../../../components/account-form-modal";
import { getColors } from "../../../../lib/colors";
import { cn } from "../../../../lib/cn";

export default function AccountsScreen() {
  const router = useRouter();
  const { data } = useAccountsWithBalances();
  const createAccount = useCreateAccount();
  const [showAdd, setShowAdd] = useState(false);
  const c = getColors(useColorScheme().colorScheme);

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
          <Text className="text-sm text-text-secondary mb-1">Total Assets</Text>
          <Text
            className={cn(
              "text-2xl font-bold",
              data.total >= 0 ? "text-text" : "text-expense",
            )}
          >
            {data.total < 0 ? "-" : ""}
            {formatCurrency(Math.abs(data.total))}
          </Text>
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
                className="flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-card"
                onPress={() =>
                  router.push({
                    pathname: "/account-detail",
                    params: { id: String(account.id) },
                  })
                }
              >
                <View className="flex-1">
                  <Text className="text-base text-text">{account.name}</Text>
                  {account.description ? (
                    <Text className="text-xs text-text-muted mt-0.5">
                      {account.description}
                    </Text>
                  ) : null}
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
            createAccount.mutate(values);
            setShowAdd(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
