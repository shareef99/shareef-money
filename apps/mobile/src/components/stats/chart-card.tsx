import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

// Shared card chrome for every chart on the Stats dashboard.
export function ChartCard({ title, subtitle, right, children }: Props) {
  return (
    <View className="mx-4 mb-3 bg-card rounded-xl p-4">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-text">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-text-muted mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
