import { Pressable, Text, View } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";
import { bankDisplayName } from "@shareef-money/shared/sms";
import type { SmsImport } from "@shareef-money/db/schema";
import { cn } from "../../lib/cn";

type Props = {
  sms: SmsImport;
  onImport?: () => void;
  onDismiss?: () => void;
  onRestore?: () => void;
  /** Opens the linked transaction (imported rows). */
  onOpenTransaction?: () => void;
};

export function SmsImportCard({
  sms,
  onImport,
  onDismiss,
  onRestore,
  onOpenTransaction,
}: Props) {
  const isExpense = sms.type === "expense";
  const bank = bankDisplayName(sms.bankCode);
  const when = sms.receivedAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  return (
    <View className="mx-4 mb-3 bg-card rounded-xl p-4">
      <View className="flex-row items-center">
        <View className="flex-1 pr-3">
          <Text className="text-base font-medium text-text" numberOfLines={1}>
            {sms.counterparty ?? bank ?? sms.sender}
          </Text>
          <Text className="text-xs text-text-muted mt-0.5">
            {[bank, sms.accountLast4 ? `··${sms.accountLast4}` : null, when]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <Text
          className={cn(
            "text-base font-semibold",
            isExpense ? "text-expense" : "text-income",
          )}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(sms.amount)}
        </Text>
      </View>

      <Text className="text-xs text-text-muted mt-2" numberOfLines={2}>
        {sms.body.replace(/\s+/g, " ").trim()}
      </Text>

      {sms.status === "pending" && (
        <View className="flex-row gap-3 mt-3">
          <Pressable
            className="flex-1 h-10 rounded-lg bg-primary items-center justify-center active:opacity-80"
            onPress={onImport}
          >
            <Text className="text-sm font-semibold text-primary-foreground">
              Import
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 h-10 rounded-lg border border-border items-center justify-center active:opacity-70"
            onPress={onDismiss}
          >
            <Text className="text-sm font-medium text-text-secondary">
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}

      {sms.status === "imported" && (
        <Pressable className="mt-3 active:opacity-70" onPress={onOpenTransaction}>
          <Text className="text-sm font-medium text-primary">
            ✓ Imported — view transaction
          </Text>
        </Pressable>
      )}

      {sms.status === "dismissed" && (
        <Pressable
          className="mt-3 h-10 rounded-lg border border-border items-center justify-center active:opacity-70"
          onPress={onRestore}
        >
          <Text className="text-sm font-medium text-text-secondary">
            Restore to pending
          </Text>
        </Pressable>
      )}
    </View>
  );
}
