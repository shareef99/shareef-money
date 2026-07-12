import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useAccountTransactions } from "../../../queries/use-transactions";
import {
  useAccountsWithBalances,
  useUpdateAccount,
  useArchiveAccount,
} from "../../../queries/use-accounts";
import { AccountFormModal } from "../../../components/account-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

export default function AccountDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const accountId = params.id ? Number(params.id) : null;
  const c = getColors(useColorScheme().colorScheme);

  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const { data } = useAccountsWithBalances();
  const { data: accountTxns = [] } = useAccountTransactions(accountId);
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();

  const account = useMemo(
    () => data.accounts.find((a) => a.id === accountId),
    [data, accountId],
  );

  if (!account) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 bg-background items-center justify-center">
          <Text className="text-text-secondary">Account not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1" numberOfLines={1}>
            {account.name}
          </Text>
          <Pressable onPress={() => setShowEdit(true)} className="p-2">
            <Pencil size={20} color={c.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setShowArchive(true)} className="p-2">
            <Trash2 size={20} color={c.error} />
          </Pressable>
        </View>

        <View className="mx-4 my-2 bg-card rounded-xl p-4">
          <Text className="text-sm text-text-secondary mb-1">Balance</Text>
          <Text
            className={cn(
              "text-2xl font-bold",
              account.balance >= 0 ? "text-text" : "text-expense",
            )}
          >
            {account.balance < 0 ? "-" : ""}
            {formatCurrency(Math.abs(account.balance))}
          </Text>
          {account.description ? (
            <Text className="text-sm text-text-muted mt-1">{account.description}</Text>
          ) : null}
        </View>

        <FlatList
          data={accountTxns}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-text-secondary">No transactions</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOutgoingTransfer =
              item.type === "transfer" && item.accountId === accountId;
            const isIncomingTransfer =
              item.type === "transfer" && item.toAccountId === accountId;
            const negative = item.type === "expense" || isOutgoingTransfer;
            return (
              <Pressable
                className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                onPress={() =>
                  router.push({ pathname: "/add-transaction", params: { id: item.id } })
                }
              >
                <View className="flex-1">
                  <Text className="text-sm text-text">
                    {item.category?.name ??
                      (item.type === "transfer"
                        ? isIncomingTransfer
                          ? "Transfer in"
                          : "Transfer out"
                        : "(No category)")}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    {(item.date instanceof Date
                      ? item.date
                      : new Date(item.date as number)
                    ).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    {item.note ? ` · ${item.note}` : ""}
                  </Text>
                </View>
                <Text
                  className={cn(
                    "text-sm font-medium",
                    item.type === "income" && "text-income",
                    negative && "text-expense",
                    isIncomingTransfer && "text-income",
                  )}
                >
                  {negative ? "-" : ""}
                  {formatCurrency(item.amount)}
                </Text>
              </Pressable>
            );
          }}
        />

        <AccountFormModal
          visible={showEdit}
          title="Edit Account"
          initialName={account.name}
          initialDescription={account.description}
          initialColor={account.color}
          initialHidden={account.isHidden}
          showHideToggle
          // Balance is derived from the opening-balance income entry; editing a
          // raw initialBalance here would double-count it, so hide the field and
          // never send it on update.
          showBalance={false}
          onClose={() => setShowEdit(false)}
          onSubmit={(values) => {
            updateAccount.mutate({
              id: account.id,
              payload: {
                name: values.name,
                description: values.description,
                color: values.color,
                isHidden: values.isHidden,
              },
            });
            setShowEdit(false);
          }}
        />

        <ConfirmModal
          visible={showArchive}
          title={`Delete "${account.name}"?`}
          message="Your transactions will not be deleted. This account will be archived and hidden from lists."
          confirmLabel="Archive"
          onCancel={() => setShowArchive(false)}
          onConfirm={() => {
            archiveAccount.mutate(account.id, { onSuccess: () => router.back() });
            setShowArchive(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
