import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ArrowUpDown, Trash2 } from "lucide-react-native";
import {
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../../../queries/use-transactions";
import { useCreateRecurringRule } from "../../../queries/use-recurring";
import {
  FREQUENCY_LABELS,
  type Frequency,
} from "../../../services/recurring-service";
import { useSettings } from "../../../queries/use-settings";
import { useCategories } from "../../../queries/use-categories";
import { useAccountsWithBalances } from "../../../queries/use-accounts";
import { useLocations, useCreateLocation } from "../../../queries/use-locations";
import { useContacts, useCreateContact } from "../../../queries/use-contacts";
import {
  useSmsImportPrefill,
  useLinkSmsImport,
} from "../../../queries/use-sms-imports";
import { TransactionTypeTabs } from "../../../components/transaction-type-tabs";
import { NumericKeypad } from "../../../components/numeric-keypad";
import { CategoryPicker } from "../../../components/category-picker";
import { AccountPicker } from "../../../components/account-picker";
import { LocationPicker } from "../../../components/location-picker";
import { ContactPicker } from "../../../components/contact-picker";
import { toSmallestUnit } from "@shareef-money/shared/utils";
import type { TransactionType } from "@shareef-money/shared/types";
import { cn } from "../../../lib/cn";
import { getColors } from "../../../lib/colors";
import { TYPE_BG, TYPE_BORDER, TYPE_LABELS } from "../../../lib/transaction-type-styles";

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; smsId?: string }>();
  const editId = params.id ? Number(params.id) : null;
  // Importing a detected bank SMS: prefills the form and, on save, links the
  // SMS + remembers the merchant/account choices for next time.
  const smsId = params.smsId ? Number(params.smsId) : null;

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
  const [locationId, setLocationId] = useState<number | null>(null);
  const [contactIds, setContactIds] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<Frequency | "none">("none");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [editingFee, setEditingFee] = useState(false);
  const c = getColors(useColorScheme());

  const { data: categories = [] } = useCategories(
    type === "income" || type === "expense" ? type : undefined,
  );
  // Live balances so the account picker shows real amounts (not the always-zero
  // stored opening balance). Hidden accounts aren't selectable for new entries.
  const { data: accountsData } = useAccountsWithBalances();
  const accounts = useMemo(
    () => accountsData.accounts.filter((a) => !a.isHidden),
    [accountsData],
  );
  const { data: locations = [] } = useLocations();
  const { data: contacts = [] } = useContacts();
  const { data: editTx } = useTransaction(editId);
  const { data: settings } = useSettings();
  const { data: smsPrefill } = useSmsImportPrefill(smsId);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createRecurringRule = useCreateRecurringRule();
  const createLocation = useCreateLocation();
  const createContact = useCreateContact();
  const linkSmsImport = useLinkSmsImport();

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const categoryDisplay = useMemo(() => {
    if (!selectedCategory) return " ";
    if (selectedCategory.parentId) {
      const parent = categories.find((c) => c.id === selectedCategory.parentId);
      return parent
        ? `${parent.name} / ${selectedCategory.name}`
        : selectedCategory.name;
    }
    return selectedCategory.name;
  }, [selectedCategory, categories]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );

  const selectedToAccount = useMemo(
    () => accounts.find((a) => a.id === toAccountId),
    [accounts, toAccountId],
  );

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === locationId),
    [locations, locationId],
  );

  const contactSummary = useMemo(() => {
    if (contactIds.length === 0) return " ";
    const names = contactIds
      .map((id) => contacts.find((c) => c.id === id)?.name)
      .filter(Boolean);
    return names.join(", ");
  }, [contactIds, contacts]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]!.id);
    }
  }, [accounts, accountId]);

  // Prefill from a detected bank SMS (import flow): amount, direction, date,
  // note, plus the remembered account/category for this bank & merchant. The
  // ref guards against re-running if the query refetches while editing.
  const smsPrefillApplied = useRef(false);
  useEffect(() => {
    if (!smsPrefill?.sms || editId || smsPrefillApplied.current) return;
    smsPrefillApplied.current = true;
    const { sms, mappedAccountId, rule } = smsPrefill;
    setType(sms.type);
    setAmountStr(String(sms.amount / 100));
    setDate(
      sms.receivedAt instanceof Date
        ? sms.receivedAt
        : new Date(sms.receivedAt as number),
    );
    setNote(sms.counterparty ?? "");
    if (mappedAccountId != null) setAccountId(mappedAccountId);
    if (rule) {
      setCategoryId(rule.categoryId);
      if (rule.locationId != null) setLocationId(rule.locationId);
    }
    // The amount is already parsed — drop straight into the form.
    setShowKeypad(false);
  }, [smsPrefill, editId]);

  useEffect(() => {
    if (!editTx) return;
    setType(editTx.type);
    setAmountStr(String(editTx.amount / 100));
    setFeeStr(String(editTx.fee / 100));
    setShowFeeRow(editTx.fee > 0);
    setDate(editTx.date instanceof Date ? editTx.date : new Date(editTx.date as number));
    setCategoryId(editTx.categoryId);
    setAccountId(editTx.accountId);
    setToAccountId(editTx.toAccountId);
    setLocationId(editTx.locationId ?? null);
    setContactIds((editTx.transactionContacts ?? []).map((tc) => tc.contactId));
    setNote(editTx.note ?? "");
  }, [editTx]);

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

      // A transfer must have a distinct destination — otherwise the amount is
      // debited from the source and credited nowhere (the balance calc no-ops a
      // null target), silently losing money.
      if (type === "transfer") {
        if (!toAccountId) {
          Alert.alert("Destination required", "Choose the account to transfer to.");
          return;
        }
        if (toAccountId === accountId) {
          Alert.alert("Same account", "Transfer source and destination must be different.");
          return;
        }
      }

      // Required-field validation (category always; others per settings).
      if (type !== "transfer") {
        if (!categoryId) {
          Alert.alert("Category required", "Please select a category.");
          return;
        }
        if (settings.requireSubcategory && selectedCategory && !selectedCategory.parentId) {
          const hasSubs = categories.some((c) => c.parentId === selectedCategory.id);
          if (hasSubs) {
            Alert.alert("Subcategory required", "Please select a subcategory.");
            return;
          }
        }
      }
      if (settings.requireLocation && !locationId) {
        Alert.alert("Location required", "Please select a location.");
        return;
      }
      if (settings.requireContact && contactIds.length === 0) {
        Alert.alert("People required", "Please add at least one person.");
        return;
      }

      const payload = {
        type,
        amount,
        fee: type === "transfer" ? toSmallestUnit(parseFloat(feeStr) || 0) : 0,
        categoryId: type === "transfer" ? null : categoryId,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : null,
        locationId,
        contactIds,
        note: note || null,
        date: date.getTime(),
      };

      if (editId) {
        updateTransaction.mutate({ id: editId, payload }, { onSuccess });
      } else {
        createTransaction.mutate(payload, {
          onSuccess: (tx) => {
            // The new transaction becomes the template for its recurring rule.
            if (repeat !== "none" && tx) {
              createRecurringRule.mutate({
                transactionId: tx.id,
                frequency: repeat,
                startDate: new Date(payload.date),
              });
            }
            // Importing an SMS: link it and remember the choices so the next
            // message from this merchant/bank is one tap (or auto-imported).
            if (smsId && tx && smsPrefill?.sms) {
              linkSmsImport.mutate({
                smsImportId: smsId,
                transactionId: tx.id,
                choices: {
                  counterparty: smsPrefill.sms.counterparty,
                  categoryId: payload.categoryId ?? null,
                  locationId: payload.locationId ?? null,
                  bankCode: smsPrefill.sms.bankCode,
                  accountLast4: smsPrefill.sms.accountLast4,
                  accountId: payload.accountId,
                },
              });
            }
            onSuccess();
          },
        });
      }
    },
    [
      amountStr, feeStr, type, categoryId, accountId, toAccountId,
      locationId, contactIds, note, date, editId, repeat,
      createTransaction, updateTransaction, createRecurringRule,
      settings, categories, selectedCategory,
      smsId, smsPrefill, linkSmsImport,
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
      setLocationId(null);
      setContactIds([]);
      setNote("");
      setRepeat("none");
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
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            {TYPE_LABELS[type]}
          </Text>
          {editId && (
            <Pressable onPress={handleDelete} className="p-2">
              <Trash2 size={20} color={c.error} />
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
                <Text className="text-base text-text">{categoryDisplay}</Text>
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
                  <ArrowUpDown size={16} color={c.textSecondary} />
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

          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">Location</Text>
            <Pressable
              className="flex-1 py-2 border-b border-border"
              onPress={() => { setShowKeypad(false); setShowLocationPicker(true); }}
            >
              <Text className="text-base text-text">
                {selectedLocation?.name ?? " "}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center py-1.5">
            <Text className="w-20 text-sm text-text-secondary">People</Text>
            <Pressable
              className="flex-1 py-2 border-b border-border"
              onPress={() => { setShowKeypad(false); setShowContactPicker(true); }}
            >
              <Text className="text-base text-text" numberOfLines={1}>
                {contactSummary}
              </Text>
            </Pressable>
          </View>

          {!editId && (
            <View className="py-2.5">
              <Text className="text-sm text-text-secondary mb-2">Repeat</Text>
              <View className="flex-row flex-wrap gap-2">
                {(
                  [
                    { key: "none", label: "Off" },
                    { key: "daily", label: FREQUENCY_LABELS.daily },
                    { key: "weekly", label: FREQUENCY_LABELS.weekly },
                    { key: "monthly", label: FREQUENCY_LABELS.monthly },
                    { key: "yearly", label: FREQUENCY_LABELS.yearly },
                  ] as const
                ).map((opt) => (
                  <Pressable
                    key={opt.key}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full border",
                      repeat === opt.key
                        ? "bg-primary border-primary"
                        : "bg-card border-border",
                    )}
                    onPress={() => setRepeat(opt.key as Frequency | "none")}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        repeat === opt.key
                          ? "text-primary-foreground"
                          : "text-text-secondary",
                      )}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

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
            {!editId && !smsId && (
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
          onEdit={() => {
            setShowCategoryPicker(false);
            router.push({ pathname: "/category-list", params: { type } });
          }}
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

        <LocationPicker
          visible={showLocationPicker}
          locations={locations}
          selectedId={locationId}
          onClose={() => setShowLocationPicker(false)}
          onSelect={(loc) => { setLocationId(loc?.id ?? null); setShowLocationPicker(false); }}
          onCreate={(name) =>
            createLocation.mutate(name, {
              onSuccess: (loc) => loc && setLocationId(loc.id),
            })
          }
        />

        <ContactPicker
          visible={showContactPicker}
          contacts={contacts}
          selectedIds={contactIds}
          onClose={() => setShowContactPicker(false)}
          onToggle={(id) =>
            setContactIds((prev) =>
              prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
            )
          }
          onCreate={(name) =>
            createContact.mutate(name, {
              onSuccess: (contact) =>
                contact && setContactIds((prev) => [...prev, contact.id]),
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}
