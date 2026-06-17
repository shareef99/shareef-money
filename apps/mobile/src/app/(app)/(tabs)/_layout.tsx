import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  ArrowLeftRight,
  BarChart3,
  Wallet,
  HandCoins,
  MoreHorizontal,
} from "lucide-react-native";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "../../../lib/colors";
import { useEnsureDefaultCategories } from "../../../queries/use-categories";
import { useMigrateOpeningBalances } from "../../../queries/use-accounts";
import { useSettings } from "../../../queries/use-settings";

export default function TabLayout() {
  const scheme = useColorScheme();
  const c = getColors(scheme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: settings } = useSettings();
  const didRedirect = useRef(false);

  // Make sure the user always has default categories to choose from.
  useEnsureDefaultCategories();
  // Convert any legacy account opening balances into income transactions.
  useMigrateOpeningBalances();

  // Honor the configured start screen on first load (default is transactions).
  // Route groups in parens aren't URL segments, so the tab href is just "/tab".
  useEffect(() => {
    if (didRedirect.current) return;
    if (settings.startScreen && settings.startScreen !== "transactions") {
      didRedirect.current = true;
      router.replace(`/${settings.startScreen}`);
    }
  }, [settings.startScreen, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Let ThemedRoot's themed background show behind the status bar.
        sceneStyle: { backgroundColor: "transparent" },
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
        name="debts"
        options={{
          title: "Debts",
          tabBarIcon: ({ color, size }) => (
            <HandCoins size={size} color={color} strokeWidth={1.5} />
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
