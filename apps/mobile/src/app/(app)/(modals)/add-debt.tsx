import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../../../queries/use-transactions";
import { useAccounts } from "../../../queries/use-accounts";
import { useContacts, useCreateContact } from "../../../queries/use-contacts";
import { NumericKeypad } from "../../../components/numeric-keypad";
import { AccountPicker } from "../../../components/account-picker";
import { ContactPicker } from "../../../components/contact-picker";
import { toSmallestUnit } from "@shareef-money/shared/utils";
import { DEBT_TYPE_TABS } from "@shareef-money/shared/constants";
import type { DebtType } from "@shareef-money/shared/types";
import { cn } from "../../../lib/cn";
import { getColors } from "../../../lib/colors";

export default function AddDebtScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    contactId?: string;
    amount?: string;
  }>();
  const editId = params.id ? Number(params.id) : null;
  const c = getColors(useColorScheme());

  const [type, setType] = useState<DebtType>(
    params.type === "debt_borrow" ? "debt_borrow" : "debt_lend",
  );
  const [amountStr, setAmountStr] = useState(params.amount ?? "");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(
    params.contactId ? Number(params.contactId) : null,
  );
  const [note, setNote] = useState("");
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);

  const { data: accounts = [] } = useAccounts();
  const { data: contacts = [] } = useContacts();
  const { data: allTransactions = [] } = useTransactions({});

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createContact = useCreateContact();

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );
  const selectedContact = useMemo(
    () => contacts.find((p) => p.id === contactId),
    [contacts, contactId],
  );

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0]!.id);
  }, [accounts, accountId]);

  useEffect(() => {
    if (!editId) return;
    const tx = allTransactions.find((t) => t.id === editId);
    if (tx) {
      setType(tx.type === "debt_borrow" ? "debt_borrow" : "debt_lend");
      setAmountStr(String(tx.amount / 100));
      setDate(tx.date instanceof Date ? tx.date : new Date(tx.date as number));
      setAccountId(tx.accountId);
      setContactId(tx.contactId ?? null);
      setNote(tx.note ?? "");
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

  const submit = useCallback(
    (onSuccess: () => void) => {
      const amount = toSmallestUnit(parseFloat(amountStr) || 0);
      if (amount <= 0 || !accountId) return;
      if (!contactId) {
        Alert.alert("Person required", "Please choose who this debt is with.");
        return;
      }
      const payload = {
        type,
        amount,
        fee: 0,
        categoryId: null,
        accountId,
        toAccountId: null,
        contactId,
        locationId: null,
        contactIds: [],
        note: note || null,
        date: date.getTime(),
      };
      if (editId) {
        updateTransaction.mutate({ id: editId, payload }, { onSuccess });
      } else {
        createTransaction.mutate(payload, { onSuccess });
      }
    },
    [
      amountStr,
      accountId,
      contactId,
      type,
      note,
      date,
      editId,
      createTransaction,
      updateTransaction,
    ],
  );

  const handleSave = useCallback(() => submit(() => router.back()), [submit, router]);

  const handleDelete = useCallback(() => {
    if (!editId) return;
    deleteTransaction.mutate(editId, { onSuccess: () => router.back() });
  }, [editId, deleteTransaction, router]);

  const isSaving = createTransaction.isPending || updateTransaction.isPending;
  // "You gave" = money leaves an account; "You got" = money enters one.
  const accountLabel = type === "debt_lend" ? "From account" : "To account";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            {editId ? "Edit debt" : "Debt"}
          </Text>
          {editId && (
            <Pressable onPress={handleDelete} className="p-2">
              <Trash2 size={20} color={c.error} />
            </Pressable>
          )}
        </View>

        {/* You gave / You got toggle */}
        <View className="px-4 mt-1 mb-4">
          <View className="flex-row gap-3">
            {DEBT_TYPE_TABS.map((tab) => (
              <Pressable
                key={tab.type}
                className={cn(
                  "flex-1 py-2 items-center rounded-lg border",
                  type === tab.type
                    ? "border-transfer bg-transfer/10"
                    : "bg-card border-border",
                )}
                onPress={() => setType(tab.type)}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    type === tab.type ? "text-transfer" : "text-text",
                  )}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-text-muted mt-2">
            {type === "debt_lend"
              ? "Money you gave out — they owe you."
              : "Money you received — you owe them (or they're repaying you)."}
          </Text>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center py-1.5">
            <Text className="w-24 text-sm text-text-secondary">Date</Text>
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
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setDate(d);
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              onChange={(_, d) => {
                setShowTimePicker(false);
                if (d) setDate(d);
              }}
            />
          )}

          <View className="flex-row items-center py-1.5">
            <Text className="w-24 text-sm text-text-secondary">Amount</Text>
            <Pressable
              className={cn(
                "flex-1 py-2 border-b",
                showKeypad ? "border-transfer" : "border-border",
              )}
              onPress={() => setShowKeypad(true)}
            >
              <Text className="text-base text-text">{amountStr || " "}</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center py-1.5">
            <Text className="w-24 text-sm text-text-secondary">Person</Text>
            <Pressable
              className="flex-1 py-2 border-b border-border"
              onPress={() => {
                setShowKeypad(false);
                setShowContactPicker(true);
              }}
            >
              <Text
                className={cn(
                  "text-base",
                  selectedContact ? "text-text" : "text-text-muted",
                )}
              >
                {selectedContact?.name ?? "Choose a person"}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center py-1.5">
            <Text className="w-24 text-sm text-text-secondary">{accountLabel}</Text>
            <Pressable
              className="flex-1 py-2 border-b border-border"
              onPress={() => {
                setShowKeypad(false);
                setShowAccountPicker(true);
              }}
            >
              <Text className="text-base text-text">
                {selectedAccount?.name ?? " "}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center py-1.5">
            <Text className="w-24 text-sm text-text-secondary">Note</Text>
            <View className="flex-1 border-b border-border">
              <TextInput
                className="text-base text-text py-2"
                value={note}
                onChangeText={setNote}
                onFocus={() => setShowKeypad(false)}
              />
            </View>
          </View>

          <View className="mt-6 mb-8">
            <Pressable
              className={cn(
                "h-12 rounded-xl items-center justify-center bg-transfer",
                isSaving && "opacity-50",
              )}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-base font-semibold text-white">
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {showKeypad && (
          <NumericKeypad
            value={amountStr}
            onChange={setAmountStr}
            onDone={() => setShowKeypad(false)}
          />
        )}

        <AccountPicker
          visible={showAccountPicker}
          onClose={() => setShowAccountPicker(false)}
          onSelect={(acc) => {
            setAccountId(acc.id);
            setShowAccountPicker(false);
          }}
          accounts={accounts}
          title={accountLabel}
        />

        <ContactPicker
          visible={showContactPicker}
          contacts={contacts}
          selectedIds={contactId ? [contactId] : []}
          onClose={() => setShowContactPicker(false)}
          onToggle={(id) => {
            setContactId(id);
            setShowContactPicker(false);
          }}
          onCreate={(name) =>
            createContact.mutate(name, {
              onSuccess: (contact) => contact && setContactId(contact.id),
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}
