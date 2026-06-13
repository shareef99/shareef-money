import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useTransactions } from "../../../queries/use-transactions";
import {
  useAccountsWithBalances,
  useUpdateAccount,
  useArchiveAccount,
} from "../../../queries/use-accounts";
import { AccountFormModal } from "../../../components/account-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";
import { cn } from "../../../lib/cn";

export default function AccountDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const accountId = params.id ? Number(params.id) : null;

  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const { data } = useAccountsWithBalances();
  const { data: transactions = [] } = useTransactions({});
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();

  const account = useMemo(
    () => data.accounts.find((a) => a.id === accountId),
    [data, accountId],
  );

  const accountTxns = useMemo(
    () =>
      transactions.filter(
        (t) => t.accountId === accountId || t.toAccountId === accountId,
      ),
    [transactions, accountId],
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
            <ArrowLeft size={24} className="text-text" />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1" numberOfLines={1}>
            {account.name}
          </Text>
          <Pressable onPress={() => setShowEdit(true)} className="p-2">
            <Pencil size={20} className="text-text-secondary" />
          </Pressable>
          <Pressable onPress={() => setShowArchive(true)} className="p-2">
            <Trash2 size={20} className="text-error" />
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

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {accountTxns.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-text-secondary">No transactions</Text>
            </View>
          ) : (
            accountTxns.map((item) => {
              const isOutgoingTransfer =
                item.type === "transfer" && item.accountId === accountId;
              const isIncomingTransfer =
                item.type === "transfer" && item.toAccountId === accountId;
              const negative = item.type === "expense" || isOutgoingTransfer;
              return (
                <Pressable
                  key={item.id}
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
            })
          )}
        </ScrollView>

        <AccountFormModal
          visible={showEdit}
          title="Edit Account"
          initialName={account.name}
          initialBalance={account.initialBalance}
          initialDescription={account.description}
          onClose={() => setShowEdit(false)}
          onSubmit={(values) => {
            updateAccount.mutate({ id: account.id, payload: values });
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
