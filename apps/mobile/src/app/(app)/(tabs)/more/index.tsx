import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Cog,
  LogOut,
  MapPin,
  Moon,
  PiggyBank,
  Shapes,
  Sun,
  Users,
} from "lucide-react-native";
import { useAuth } from "../../../../providers/auth-provider";
import { getColors } from "../../../../lib/colors";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const c = getColors(colorScheme);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Text className="text-xl font-semibold text-text px-4 py-3">Settings</Text>

        <View className="mx-4 mb-2 bg-card rounded-xl p-4">
          <Text className="text-base font-semibold text-text">{user?.name}</Text>
          <Text className="text-sm text-text-secondary">{user?.email}</Text>
        </View>

        <View className="flex-row flex-wrap px-2 py-2">
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/category-settings")}
          >
            <Shapes size={28} strokeWidth={1.5} color={c.text} />
            <Text className="text-sm text-text">Category</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/location-list")}
          >
            <MapPin size={28} strokeWidth={1.5} color={c.text} />
            <Text className="text-sm text-text">Locations</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/contact-list")}
          >
            <Users size={28} strokeWidth={1.5} color={c.text} />
            <Text className="text-sm text-text">Contacts</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/budget")}
          >
            <PiggyBank size={28} strokeWidth={1.5} color={c.text} />
            <Text className="text-sm text-text">Budget</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/configuration")}
          >
            <Cog size={28} strokeWidth={1.5} color={c.text} />
            <Text className="text-sm text-text">Settings</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={toggleColorScheme}
          >
            {colorScheme === "dark" ? (
              <Sun size={28} strokeWidth={1.5} color={c.text} />
            ) : (
              <Moon size={28} strokeWidth={1.5} color={c.text} />
            )}
            <Text className="text-sm text-text">Theme</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={logout}
          >
            <LogOut size={28} strokeWidth={1.5} color={c.error} />
            <Text className="text-sm text-error">Logout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
