import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { AccountWithBalance } from "../../../../services/account-service";
import {
  useAccountsWithBalances,
  useCreateAccount,
  useUpdateAccount,
  useArchiveAccount,
} from "../../../../queries/use-accounts";
import { AccountFormModal } from "../../../../components/account-form-modal";
import { ConfirmModal } from "../../../../components/confirm-modal";
import { cn } from "../../../../lib/cn";

export default function AccountsScreen() {
  const { data } = useAccountsWithBalances();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();

  const [formTarget, setFormTarget] = useState<"add" | AccountWithBalance | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AccountWithBalance | null>(null);

  const handleSubmit = useCallback(
    (values: { name: string; initialBalance: number; description: string | null }) => {
      if (formTarget === "add") {
        createAccount.mutate(values);
      } else if (formTarget) {
        updateAccount.mutate({ id: formTarget.id, payload: values });
      }
      setFormTarget(null);
    },
    [formTarget, createAccount, updateAccount],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-xl font-semibold text-text">Accounts</Text>
          <Pressable onPress={() => setFormTarget("add")} className="p-2 -mr-2">
            <Plus size={24} className="text-text" />
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
                onPress={() => setFormTarget(account)}
                onLongPress={() => setArchiveTarget(account)}
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
          visible={formTarget !== null}
          title={formTarget === "add" ? "Add Account" : "Edit Account"}
          initialName={formTarget && formTarget !== "add" ? formTarget.name : undefined}
          initialBalance={
            formTarget && formTarget !== "add" ? formTarget.initialBalance : undefined
          }
          initialDescription={
            formTarget && formTarget !== "add" ? formTarget.description : undefined
          }
          onClose={() => setFormTarget(null)}
          onSubmit={handleSubmit}
        />

        <ConfirmModal
          visible={archiveTarget !== null}
          title={`Delete "${archiveTarget?.name ?? ""}"?`}
          message="Your transactions will not be deleted. This account will be archived and hidden from lists. To only rename it, tap the account and edit instead."
          confirmLabel="Archive"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            if (archiveTarget) archiveAccount.mutate(archiveTarget.id);
            setArchiveTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
