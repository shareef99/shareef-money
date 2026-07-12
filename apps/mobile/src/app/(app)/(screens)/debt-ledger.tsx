import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Share2 } from "lucide-react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useContactDebtEntries, useWriteOffDebt } from "../../../queries/use-debts";
import { ConfirmModal } from "../../../components/confirm-modal";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

export default function DebtLedgerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string; name?: string }>();
  const contactId = params.contactId ? Number(params.contactId) : null;
  const c = getColors(useColorScheme().colorScheme);

  const { data } = useContactDebtEntries(contactId);
  const writeOff = useWriteOffDebt();
  const [showWriteOff, setShowWriteOff] = useState(false);

  const name = data.name || params.name || "Person";
  const owesYou = data.net > 0;
  const settled = data.net === 0;

  const openAdd = (type: "debt_lend" | "debt_borrow") => {
    if (contactId == null) return;
    router.push({
      pathname: "/add-debt",
      params: { type, contactId: String(contactId) },
    });
  };

  const settleUp = () => {
    if (settled || contactId == null) return;
    router.push({
      pathname: "/add-debt",
      params: {
        type: owesYou ? "debt_borrow" : "debt_lend",
        contactId: String(contactId),
        amount: String(Math.abs(data.net) / 100),
      },
    });
  };

  const share = () => {
    const fmtD = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const lines = [`Debt summary — ${name}`, ""];
    for (const e of [...data.entries].reverse()) {
      lines.push(
        `${fmtD(e.date)}  ${e.type === "debt_lend" ? "You gave" : "You got"}  ${formatCurrency(e.amount)}`,
      );
    }
    lines.push("");
    lines.push(
      settled
        ? "Settled up"
        : owesYou
          ? `Owes you ${formatCurrency(Math.abs(data.net))}`
          : `You owe ${formatCurrency(Math.abs(data.net))}`,
    );
    lines.push("", "— via Shareef Money");
    Share.share({ message: lines.join("\n") }).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text
            className="text-lg font-semibold text-text ml-2 flex-1"
            numberOfLines={1}
          >
            {name}
          </Text>
          {data.entries.length > 0 ? (
            <Pressable onPress={share} className="p-2">
              <Share2 size={20} color={c.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View className="mx-4 my-2 bg-card rounded-xl p-4">
          <Text className="text-sm text-text-secondary mb-1">
            {settled ? "Settled up" : owesYou ? "Owes you" : "You owe"}
          </Text>
          <Text
            className={cn(
              "text-2xl font-bold",
              settled ? "text-text" : owesYou ? "text-income" : "text-expense",
            )}
          >
            {formatCurrency(Math.abs(data.net))}
          </Text>
          {!settled && (
            <View className="flex-row gap-3 mt-3">
              <Pressable
                className="flex-1 h-10 rounded-lg bg-primary items-center justify-center active:opacity-80"
                onPress={settleUp}
              >
                <Text className="text-sm font-semibold text-primary-foreground">
                  Settle up
                </Text>
              </Pressable>
              {owesYou ? (
                <Pressable
                  className="flex-1 h-10 rounded-lg border border-border items-center justify-center active:opacity-70"
                  onPress={() => setShowWriteOff(true)}
                  disabled={writeOff.isPending}
                >
                  <Text className="text-sm font-medium text-expense">
                    Write off
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* Quick-add a new entry for this person. */}
        {contactId != null && (
          <View className="flex-row gap-3 px-4 mb-2">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl bg-card border border-border active:opacity-70"
              onPress={() => openAdd("debt_lend")}
            >
              <ArrowUpRight size={18} color={c.expense} />
              <Text className="text-sm font-medium text-text">You gave</Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl bg-card border border-border active:opacity-70"
              onPress={() => openAdd("debt_borrow")}
            >
              <ArrowDownLeft size={18} color={c.income} />
              <Text className="text-sm font-medium text-text">You got</Text>
            </Pressable>
          </View>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {data.entries.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-text-secondary">No entries</Text>
            </View>
          ) : (
            data.entries.map((e) => {
              const gave = e.type === "debt_lend";
              const overdue =
                e.dueDate != null &&
                data.net !== 0 &&
                e.dueDate.getTime() < Date.now();
              return (
                <Pressable
                  key={e.id}
                  className="flex-row items-center px-4 py-3 border-b border-border active:bg-card"
                  onPress={() =>
                    router.push({
                      pathname: "/add-debt",
                      params: { id: String(e.id) },
                    })
                  }
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm text-text">
                      {gave ? "You gave" : "You got"}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      {e.date.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {e.accountName ? ` · ${e.accountName}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </Text>
                    {e.dueDate ? (
                      <Text
                        className={cn(
                          "text-xs mt-0.5",
                          overdue ? "text-expense font-medium" : "text-text-muted",
                        )}
                      >
                        {overdue ? "Overdue · " : "Due "}
                        {e.dueDate.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Text
                      className={cn(
                        "text-sm font-medium",
                        gave ? "text-expense" : "text-income",
                      )}
                    >
                      {gave ? "-" : "+"}
                      {formatCurrency(e.amount)}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      bal {e.runningBalance < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(e.runningBalance))}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <ConfirmModal
          visible={showWriteOff}
          title={`Write off ${formatCurrency(Math.abs(data.net))}?`}
          message={`Records the outstanding amount as a "Bad debt" expense and settles ${name} to zero. Your net worth drops by this amount.`}
          confirmLabel="Write off"
          onCancel={() => setShowWriteOff(false)}
          onConfirm={() => {
            if (contactId != null) {
              writeOff.mutate({ contactId, name });
            }
            setShowWriteOff(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
