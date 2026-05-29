import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  Trash2,
  X,
} from "lucide-react-native";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../../../queries/use-transactions";
import { useCategories } from "../../../queries/use-categories";
import { useAccounts } from "../../../queries/use-accounts";
import { TransactionTypeTabs } from "../../../components/transaction-type-tabs";
import { NumericKeypad } from "../../../components/numeric-keypad";
import { CategoryPicker } from "../../../components/category-picker";
import { AccountPicker } from "../../../components/account-picker";
import { toSmallestUnit } from "@shareef-money/shared/utils";
import type { TransactionType } from "@shareef-money/shared/types";
import { cn } from "../../../lib/cn";
import { getColors } from "../../../lib/colors";

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;

  const [type, setType] = useState<TransactionType>("expense");
  const [amountStr, setAmountStr] = useState("");
  const [feeStr, setFeeStr] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [editingFee, setEditingFee] = useState(false);
  const { textMuted } = getColors(useColorScheme());

  const { data: categories = [] } = useCategories(
    type === "transfer" ? undefined : type,
  );
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useTransactions({});

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );

  const selectedToAccount = useMemo(
    () => accounts.find((a) => a.id === toAccountId),
    [accounts, toAccountId],
  );

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]!.id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (!editId) return;
    const tx = allTransactions.find((t) => t.id === editId);
    if (tx) {
      setType(tx.type as TransactionType);
      setAmountStr(String(tx.amount / 100));
      setFeeStr(String(tx.fee / 100));
      setDate(tx.date instanceof Date ? tx.date : new Date(tx.date as number));
      setCategoryId(tx.categoryId);
      setAccountId(tx.accountId);
      setToAccountId(tx.toAccountId);
      setNote(tx.note ?? "");
      setDescription(tx.description ?? "");
    }
  }, [editId, allTransactions]);

  const amountDisplay = useMemo(() => {
    if (!amountStr) return "0.00";
    const num = parseFloat(amountStr);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amountStr]);

  const handleSave = useCallback(() => {
    const amount = toSmallestUnit(parseFloat(amountStr) || 0);
    if (amount <= 0 || !accountId) return;

    const payload = {
      type,
      amount,
      fee: type === "transfer" ? toSmallestUnit(parseFloat(feeStr) || 0) : 0,
      categoryId: type === "transfer" ? null : categoryId,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : null,
      note: note || null,
      description: description || null,
      date: date.getTime(),
    };

    if (editId) {
      updateTransaction.mutate({ id: editId, payload }, { onSuccess: () => router.back() });
    } else {
      createTransaction.mutate(payload, { onSuccess: () => router.back() });
    }
  }, [
    amountStr, feeStr, type, categoryId, accountId, toAccountId,
    note, description, date, editId, createTransaction, updateTransaction, router,
  ]);

  const handleDelete = useCallback(() => {
    if (!editId) return;
    deleteTransaction.mutate(editId, { onSuccess: () => router.back() });
  }, [editId, deleteTransaction, router]);

  const swapAccounts = useCallback(() => {
    const temp = accountId;
    setAccountId(toAccountId);
    setToAccountId(temp);
  }, [accountId, toAccountId]);

  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <X size={24} className="text-text" />
          </Pressable>
          <Text className="text-base font-semibold text-text">
            {editId ? "Edit Transaction" : "Add Transaction"}
          </Text>
          <View className="flex-row items-center gap-2">
            {editId && (
              <Pressable onPress={handleDelete} className="p-2">
                <Trash2 size={20} className="text-error" />
              </Pressable>
            )}
            <Pressable onPress={handleSave} disabled={isSaving} className="p-2">
              <Text className={cn("font-semibold", isSaving ? "text-text-muted" : "text-primary")}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 mb-3">
          <TransactionTypeTabs selected={type} onSelect={setType} />
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <Pressable
            className="items-center py-4"
            onPress={() => { setEditingFee(false); setShowKeypad(true); }}
          >
            <Text className="text-xs text-text-secondary mb-1">Amount</Text>
            <Text
              className={cn(
                "text-3xl font-bold",
                type === "income" && "text-income",
                type === "expense" && "text-expense",
                type === "transfer" && "text-transfer",
              )}
            >
              ₹ {amountDisplay}
            </Text>
          </Pressable>

          {type === "transfer" && (
            <Pressable
              className="items-center pb-2"
              onPress={() => { setEditingFee(true); setShowKeypad(true); }}
            >
              <Text className="text-xs text-text-secondary mb-1">Fee</Text>
              <Text className="text-lg text-text-secondary">₹ {feeStr || "0.00"}</Text>
            </Pressable>
          )}

          <Pressable
            className="flex-row items-center py-3 border-b border-border"
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={18} className="text-text-secondary mr-3" />
            <Text className="text-sm text-text flex-1">
              {date.toLocaleDateString("en-US", {
                weekday: "short", year: "numeric", month: "short", day: "numeric",
              })}
            </Text>
            <Pressable onPress={() => setShowTimePicker(true)}>
              <Text className="text-sm text-primary">
                {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              onChange={(_, d) => { setShowTimePicker(false); if (d) setDate(d); }}
            />
          )}

          {type !== "transfer" && (
            <Pressable
              className="flex-row items-center py-3 border-b border-border"
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text className="text-xl mr-3">{selectedCategory?.icon ?? "📂"}</Text>
              <Text className="text-sm text-text flex-1">
                {selectedCategory?.name ?? "Select Category"}
              </Text>
              <ChevronDown size={18} className="text-text-secondary" />
            </Pressable>
          )}

          <Pressable
            className="flex-row items-center py-3 border-b border-border"
            onPress={() => setShowAccountPicker(true)}
          >
            <Text className="text-sm text-text-secondary mr-3">
              {type === "transfer" ? "From" : "Account"}
            </Text>
            <Text className="text-sm text-text flex-1">
              {selectedAccount?.name ?? "Select Account"}
            </Text>
            <ChevronDown size={18} className="text-text-secondary" />
          </Pressable>

          {type === "transfer" && (
            <>
              <View className="items-center py-1">
                <Pressable onPress={swapAccounts} className="p-2">
                  <ArrowLeftRight size={18} className="text-primary" />
                </Pressable>
              </View>
              <Pressable
                className="flex-row items-center py-3 border-b border-border"
                onPress={() => setShowToAccountPicker(true)}
              >
                <Text className="text-sm text-text-secondary mr-3">To</Text>
                <Text className="text-sm text-text flex-1">
                  {selectedToAccount?.name ?? "Select Account"}
                </Text>
                <ChevronDown size={18} className="text-text-secondary" />
              </Pressable>
            </>
          )}

          <View className="py-3 border-b border-border">
            <TextInput
              className="text-sm text-text"
              placeholder="Note"
              placeholderTextColor={textMuted}
              value={note}
              onChangeText={setNote}
              onFocus={() => setShowKeypad(false)}
            />
          </View>

          <View className="py-3 border-b border-border">
            <TextInput
              className="text-sm text-text"
              placeholder="Description"
              placeholderTextColor={textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              onFocus={() => setShowKeypad(false)}
            />
          </View>
        </ScrollView>

        {showKeypad && (
          <NumericKeypad
            value={editingFee ? feeStr : amountStr}
            onChange={(v) => (editingFee ? setFeeStr(v) : setAmountStr(v))}
            onDone={() => setShowKeypad(false)}
          />
        )}

        <CategoryPicker
          visible={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          onSelect={(cat) => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
          categories={categories}
          title={type === "income" ? "Income Category" : "Expense Category"}
        />

        <AccountPicker
          visible={showAccountPicker}
          onClose={() => setShowAccountPicker(false)}
          onSelect={(acc) => { setAccountId(acc.id); setShowAccountPicker(false); }}
          accounts={accounts}
          title={type === "transfer" ? "From Account" : "Account"}
        />

        <AccountPicker
          visible={showToAccountPicker}
          onClose={() => setShowToAccountPicker(false)}
          onSelect={(acc) => { setToAccountId(acc.id); setShowToAccountPicker(false); }}
          accounts={accounts.filter((a) => a.id !== accountId)}
          title="To Account"
        />
      </View>
    </SafeAreaView>
  );
}
