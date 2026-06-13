import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ArrowUpDown, Trash2 } from "lucide-react-native";
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
import { TYPE_BG, TYPE_BORDER, TYPE_LABELS } from "../../../lib/transaction-type-styles";

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;

  const [type, setType] = useState<TransactionType>("expense");
  const [amountStr, setAmountStr] = useState("");
  const [feeStr, setFeeStr] = useState("");
  const [showFeeRow, setShowFeeRow] = useState(false);
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
      setShowFeeRow(tx.fee > 0);
      setDate(tx.date instanceof Date ? tx.date : new Date(tx.date as number));
      setCategoryId(tx.categoryId);
      setAccountId(tx.accountId);
      setToAccountId(tx.toAccountId);
      setNote(tx.note ?? "");
      setDescription(tx.description ?? "");
    }
  }, [editId, allTransactions]);

  const dateDisplay = useMemo(() => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${dd}/${mm}/${date.getFullYear()} (${weekday})`;
  }, [date]);

  const timeDisplay = useMemo(
    () => date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    [date],
  );

  const handleTypeChange = useCallback((next: TransactionType) => {
    setType(next);
    if (next !== "transfer") {
      setEditingFee(false);
      setShowFeeRow(false);
      setFeeStr("");
    }
  }, []);

  const submit = useCallback(
    (onSuccess: () => void) => {
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
        updateTransaction.mutate({ id: editId, payload }, { onSuccess });
      } else {
        createTransaction.mutate(payload, { onSuccess });
      }
    },
    [
      amountStr, feeStr, type, categoryId, accountId, toAccountId,
      note, description, date, editId, createTransaction, updateTransaction,
    ],
  );

  const handleSave = useCallback(() => {
    submit(() => router.back());
  }, [submit, router]);

  const handleContinue = useCallback(() => {
    submit(() => {
      setAmountStr("");
      setFeeStr("");
      setShowFeeRow(false);
      setCategoryId(null);
      setNote("");
      setDescription("");
      setEditingFee(false);
      setShowKeypad(true);
    });
  }, [submit]);

  const handleDelete = useCallback(() => {
    if (!editId) return;
    deleteTransaction.mutate(editId, { onSuccess: () => router.back() });
  }, [editId, deleteTransaction, router]);

  const swapAccounts = useCallback(() => {
    const temp = accountId;
    setAccountId(toAccountId);
    setToAccountId(temp);
  }, [accountId, toAccountId]);

  const toggleFees = useCallback(() => {
    if (showFeeRow) {
      setShowFeeRow(false);
      setFeeStr("");
      setEditingFee(false);
    } else {
      setShowFeeRow(true);
      setEditingFee(true);
      setShowKeypad(true);
    }
  }, [showFeeRow]);

  const isSaving = createTransaction.isPending || updateTransaction.isPending;
  const amountActive = showKeypad && !editingFee;
  const feeActive = showKeypad && editingFee;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text" />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            {TYPE_LABELS[type]}
          </Text>
          {editId && (
            <Pressable onPress={handleDelete} className="p-2">
              <Trash2 size={20} className="text-error" />
            </Pressable>
          )}
        </View>

        <View className="px-4 mt-1 mb-4">
          <TransactionTypeTabs selected={type} onSelect={handleTypeChange} />
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">Date</Text>
            <View className="flex-1 flex-row items-center gap-5 border-b border-border py-2">
              <Pressable onPress={() => setShowDatePicker(true)}>
                <Text className="text-base text-text">{dateDisplay}</Text>
              </Pressable>
              <Pressable onPress={() => setShowTimePicker(true)}>
                <Text className="text-base text-text">{timeDisplay}</Text>
              </Pressable>
            </View>
          </View>

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

          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">Amount</Text>
            <Pressable
              className={cn(
                "flex-1 flex-row items-center justify-between py-2 border-b",
                amountActive ? TYPE_BORDER[type] : "border-border",
              )}
              onPress={() => { setEditingFee(false); setShowKeypad(true); }}
            >
              <Text className="text-base text-text">{amountStr || " "}</Text>
              {type === "transfer" && (
                <Pressable
                  className="px-3 py-1 rounded-md border border-border"
                  onPress={toggleFees}
                >
                  <Text className="text-sm text-text">Fees</Text>
                </Pressable>
              )}
            </Pressable>
          </View>

          {type === "transfer" && showFeeRow && (
            <View className="flex-row items-center py-1.5">
              <Text className="w-20 text-sm text-text-secondary">Fees</Text>
              <Pressable
                className={cn(
                  "flex-1 py-2 border-b",
                  feeActive ? TYPE_BORDER[type] : "border-border",
                )}
                onPress={() => { setEditingFee(true); setShowKeypad(true); }}
              >
                <Text className="text-base text-text">{feeStr || " "}</Text>
              </Pressable>
            </View>
          )}

          {type !== "transfer" && (
            <View className="flex-row items-center py-1.5">
              <Text className="w-20 text-sm text-text-secondary">Category</Text>
              <Pressable
                className="flex-1 py-2 border-b border-border"
                onPress={() => { setShowKeypad(false); setShowCategoryPicker(true); }}
              >
                <Text className="text-base text-text">
                  {selectedCategory
                    ? `${selectedCategory.icon ?? ""} ${selectedCategory.name}`.trim()
                    : " "}
                </Text>
              </Pressable>
            </View>
          )}

          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">
              {type === "transfer" ? "From" : "Account"}
            </Text>
            <Pressable
              className="flex-1 flex-row items-center justify-between py-2 border-b border-border"
              onPress={() => { setShowKeypad(false); setShowAccountPicker(true); }}
            >
              <Text className="text-base text-text">
                {selectedAccount?.name ?? " "}
              </Text>
              {type === "transfer" && (
                <Pressable onPress={swapAccounts} className="p-1">
                  <ArrowUpDown size={16} className="text-text-secondary" />
                </Pressable>
              )}
            </Pressable>
          </View>

          {type === "transfer" && (
            <View className="flex-row items-center py-1.5">
              <Text className="w-20 text-sm text-text-secondary">To</Text>
              <Pressable
                className="flex-1 py-2 border-b border-border"
                onPress={() => { setShowKeypad(false); setShowToAccountPicker(true); }}
              >
                <Text className="text-base text-text">
                  {selectedToAccount?.name ?? " "}
                </Text>
              </Pressable>
            </View>
          )}

          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">Note</Text>
            <View className="flex-1 border-b border-border">
              <TextInput
                className="text-base text-text py-2"
                value={note}
                onChangeText={setNote}
                onFocus={() => setShowKeypad(false)}
              />
            </View>
          </View>

          <View className="h-3 bg-divider -mx-4 mt-4" />

          <View className="border-b border-border">
            <TextInput
              className="text-base text-text py-4"
              placeholder="Description"
              placeholderTextColor={textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              onFocus={() => setShowKeypad(false)}
            />
          </View>

          <View className="flex-row gap-3 mt-6 mb-8">
            <Pressable
              className={cn(
                "flex-1 h-12 rounded-xl items-center justify-center",
                TYPE_BG[type],
                isSaving && "opacity-50",
              )}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-base font-semibold text-white">
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
            {!editId && (
              <Pressable
                className="px-6 h-12 rounded-xl items-center justify-center border border-border"
                onPress={handleContinue}
                disabled={isSaving}
              >
                <Text className="text-base font-medium text-text">Continue</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {showKeypad && (
          <NumericKeypad
            value={editingFee ? feeStr : amountStr}
            onChange={(v) => (editingFee ? setFeeStr(v) : setAmountStr(v))}
            onDone={() => { setShowKeypad(false); setEditingFee(false); }}
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
