import { Appearance, Pressable, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, MapPin, Moon, Shapes, Sun, Users } from "lucide-react-native";
import { useAuth } from "../../../../providers/auth-provider";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();

  const toggleTheme = () => {
    Appearance.setColorScheme(scheme === "dark" ? "light" : "dark");
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-4 pt-4">
        <Text className="text-xl font-semibold text-text mb-4">Settings</Text>

        <View className="bg-card rounded-xl p-4 mb-2">
          <Text className="text-base font-semibold text-text">
            {user?.name}
          </Text>
          <Text className="text-sm text-text-secondary">{user?.email}</Text>
        </View>

        <View className="flex-row flex-wrap py-2">
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/category-settings")}
          >
            <Shapes size={28} strokeWidth={1.5} className="text-text" />
            <Text className="text-sm text-text">Category</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/location-list")}
          >
            <MapPin size={28} strokeWidth={1.5} className="text-text" />
            <Text className="text-sm text-text">Locations</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={() => router.push("/contact-list")}
          >
            <Users size={28} strokeWidth={1.5} className="text-text" />
            <Text className="text-sm text-text">Contacts</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={toggleTheme}
          >
            {scheme === "dark" ? (
              <Sun size={28} strokeWidth={1.5} className="text-text" />
            ) : (
              <Moon size={28} strokeWidth={1.5} className="text-text" />
            )}
            <Text className="text-sm text-text">Theme</Text>
          </Pressable>
          <Pressable
            className="w-1/3 items-center gap-2 py-6 active:opacity-70"
            onPress={logout}
          >
            <LogOut size={28} strokeWidth={1.5} className="text-error" />
            <Text className="text-sm text-error">Logout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
