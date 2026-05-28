import { Tabs } from "expo-router";
import {
  ArrowLeftRight,
  BarChart3,
  Wallet,
  MoreHorizontal,
} from "lucide-react-native";
import { useColorScheme } from "react-native";

const LIGHT_COLORS = {
  tabBar: "#FFFFFF",
  tabBarBorder: "#E4E4E7",
  tabActive: "#2563EB",
  tabInactive: "#71717A",
};

const DARK_COLORS = {
  tabBar: "#0A0A0A",
  tabBarBorder: "#27272A",
  tabActive: "#3B82F6",
  tabInactive: "#52525B",
};

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
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
