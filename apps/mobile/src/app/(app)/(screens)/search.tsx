import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search as SearchIcon } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { TransactionType } from "@shareef-money/shared/types";
import { useTransactions } from "../../../queries/use-transactions";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

type Filter = "all" | TransactionType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "transfer", label: "Transfer" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { text, textMuted } = getColors(useColorScheme());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data: transactions = [] } = useTransactions({});

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      const haystack = [
        t.category?.name,
        t.account?.name,
        t.note,
        String(t.amount / 100),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [transactions, query, filter]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2 gap-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={text} />
          </Pressable>
          <View className="flex-1 flex-row items-center bg-card rounded-lg px-3">
            <SearchIcon size={18} className="text-text-secondary" />
            <TextInput
              className="flex-1 text-base text-text py-2 px-2"
              placeholder="Search notes, category, amount…"
              placeholderTextColor={textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
        </View>

        <View className="flex-row px-4 gap-2 py-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              className={cn(
                "px-3 py-1.5 rounded-full border",
                filter === f.key
                  ? "bg-primary border-primary"
                  : "bg-card border-border",
              )}
              onPress={() => setFilter(f.key)}
            >
              <Text
                className={cn(
                  "text-sm",
                  filter === f.key ? "text-primary-foreground" : "text-text-secondary",
                )}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {results.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-text-secondary text-base">No results</Text>
            </View>
          ) : (
            results.map((item) => (
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
                      (item.type === "transfer" ? "Transfer" : "(No category)")}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    {item.account?.name}
                    {item.note ? ` · ${item.note}` : ""}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      item.type === "income" && "text-income",
                      item.type === "expense" && "text-expense",
                      item.type === "transfer" && "text-transfer",
                    )}
                  >
                    {item.type === "expense" ? "-" : ""}
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text className="text-xs text-text-muted">
                    {(item.date instanceof Date
                      ? item.date
                      : new Date(item.date as number)
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
