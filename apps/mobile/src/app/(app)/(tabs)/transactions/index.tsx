import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { useTransactions } from "../../../../queries/use-transactions";
import { useSettings } from "../../../../queries/use-settings";
import { getColors } from "../../../../lib/colors";
import { getMonthRange, monthRangeLabel } from "../../../../lib/period";
import { DailyView } from "../../../../components/daily-view";
import { CalendarView } from "../../../../components/calendar-view";
import { MonthlyView } from "../../../../components/monthly-view";
import { TotalView } from "../../../../components/total-view";
import { viewTabLabels, type ViewTab } from "@shareef-money/shared/types";
import { cn } from "../../../../lib/cn";

export default function TransactionsScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const [activeTab, setActiveTab] = useState<ViewTab>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: settings } = useSettings();

  const { monthStart, monthEnd } = useMemo(() => {
    const { start, end } = getMonthRange(currentDate, settings.monthStartDay);
    return { monthStart: start, monthEnd: end };
  }, [currentDate, settings.monthStartDay]);

  const { data: transactions = [] } = useTransactions({
    dateFrom: monthStart,
    dateTo: monthEnd,
  });

  const navigateMonth = useCallback((dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, []);

  // Swipe: left = next, right = previous. Acts on month or tab per setting.
  const handleSwipe = useCallback(
    (dir: -1 | 1) => {
      if (settings.swipeAction === "change_tab") {
        setActiveTab((prev) => {
          const idx = viewTabLabels.findIndex((t) => t.key === prev);
          const next = Math.min(
            viewTabLabels.length - 1,
            Math.max(0, idx + dir),
          );
          return viewTabLabels[next]!.key;
        });
      } else {
        navigateMonth(dir);
      }
    },
    [settings.swipeAction, navigateMonth],
  );

  const swipeGesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.Fling()
          .direction(Directions.LEFT)
          .onEnd(() => runOnJS(handleSwipe)(1)),
        Gesture.Fling()
          .direction(Directions.RIGHT)
          .onEnd(() => runOnJS(handleSwipe)(-1)),
      ),
    [handleSwipe],
  );

  const monthLabel = monthRangeLabel(currentDate, settings.monthStartDay);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={20} color={c.text} />
          </Pressable>
          <Text className="flex-1 text-center text-base font-semibold text-text">
            {monthLabel}
          </Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
            <ChevronRight size={20} color={c.text} />
          </Pressable>
          <Pressable onPress={() => router.push("/search")} className="p-2">
            <Search size={20} color={c.text} />
          </Pressable>
        </View>

        <View className="flex-row border-b border-border">
          {viewTabLabels.map(({ key, label }) => (
            <Pressable
              key={key}
              className={cn(
                "flex-1 py-2.5 items-center border-b-2",
                activeTab === key ? "border-primary" : "border-transparent",
              )}
              onPress={() => setActiveTab(key)}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  activeTab === key ? "text-primary" : "text-text-secondary",
                )}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <GestureDetector gesture={swipeGesture}>
          <View className="flex-1">
            {activeTab === "daily" && (
              <DailyView monthStart={monthStart} monthEnd={monthEnd} />
            )}
            {activeTab === "calendar" && (
              <CalendarView
                currentDate={currentDate}
                transactions={transactions}
                onSelectDate={(date) => {
                  setCurrentDate(date);
                  setActiveTab("daily");
                }}
              />
            )}
            {activeTab === "monthly" && <MonthlyView currentDate={currentDate} />}
            {activeTab === "total" && <TotalView />}
          </View>
        </GestureDetector>

        <Pressable
          className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-fab items-center justify-center shadow-lg"
          onPress={() => router.push("/add-transaction")}
        >
          <Plus size={28} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
