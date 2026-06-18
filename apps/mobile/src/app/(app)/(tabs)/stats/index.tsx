import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatsFilterProvider } from "../../../../components/stats/stats-filter-context";
import { StatsDashboard } from "../../../../components/stats/stats-dashboard";

export default function StatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <StatsFilterProvider>
          <StatsDashboard />
        </StatsFilterProvider>
      </View>
    </SafeAreaView>
  );
}
