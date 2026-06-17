import { Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { formatCurrency } from "@shareef-money/shared/utils";
import type { TransferEdge } from "../../services/stats-service";
import { ChartCard } from "./chart-card";
import { getColors } from "../../lib/colors";

type Props = { edges: TransferEdge[] };

// Account-to-account transfers, ranked, with a proportional bar.
export function TransferFlowCard({ edges }: Props) {
  const c = getColors(useColorScheme().colorScheme);
  const max = edges.reduce((m, e) => Math.max(m, e.total), 0) || 1;

  return (
    <ChartCard title="Transfers" subtitle="between your accounts">
      {edges.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-secondary">No transfers in this range</Text>
        </View>
      ) : (
        edges.map((e) => (
          <View key={`${e.fromId}-${e.toId}`} className="py-2">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm text-text" numberOfLines={1}>
                {e.fromName}
              </Text>
              <ArrowRight size={13} color={c.textMuted} style={{ marginHorizontal: 6 }} />
              <Text className="text-sm text-text flex-1" numberOfLines={1}>
                {e.toName}
              </Text>
              <Text className="text-sm font-medium text-text ml-2">
                {formatCurrency(e.total)}
              </Text>
            </View>
            <View className="h-1.5 rounded-full bg-surface overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${(e.total / max) * 100}%`, backgroundColor: c.transfer }}
              />
            </View>
          </View>
        ))
      )}
    </ChartCard>
  );
}
