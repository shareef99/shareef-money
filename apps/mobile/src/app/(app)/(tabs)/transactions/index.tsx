import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { useTransactions } from "../../../../queries/use-transactions";
import { DailyView } from "../../../../components/daily-view";
import { CalendarView } from "../../../../components/calendar-view";
import { MonthlyView } from "../../../../components/monthly-view";
import { TotalView } from "../../../../components/total-view";
import { viewTabLabels, type ViewTab } from "@shareef-money/shared/types";
import { cn } from "../../../../lib/cn";

export default function TransactionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewTab>("daily");
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

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

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft size={20} className="text-text" />
          </Pressable>
          <Text className="flex-1 text-center text-base font-semibold text-text">
            {monthLabel}
          </Text>
          <Pressable onPress={() => navigateMonth(1)} className="p-2">
            <ChevronRight size={20} className="text-text" />
          </Pressable>
          <Pressable onPress={() => router.push("/search")} className="p-2">
            <Search size={20} className="text-text" />
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
