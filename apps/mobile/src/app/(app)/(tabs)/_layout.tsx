import { Tabs } from "expo-router";
import {
  ArrowLeftRight,
  BarChart3,
  Wallet,
  MoreHorizontal,
} from "lucide-react-native";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "../../../lib/colors";

export default function TabLayout() {
  const scheme = useColorScheme();
  const c = getColors(scheme);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
          borderTopWidth: 1,
          // Sit above the Android nav bar / gesture area, dynamic per device.
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Trans.",
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <MoreHorizontal size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
