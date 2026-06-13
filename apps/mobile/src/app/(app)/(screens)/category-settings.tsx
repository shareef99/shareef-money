import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function CategorySettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text" />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2">Category</Text>
        </View>

        <View className="bg-card px-4 py-2 mt-2">
          <Text className="text-sm text-text-secondary">Category Setting</Text>
        </View>

        <Pressable
          className="px-4 py-4 border-b border-border active:bg-card"
          onPress={() =>
            router.push({ pathname: "/category-list", params: { type: "income" } })
          }
        >
          <Text className="text-base text-text">Income Category Setting</Text>
        </Pressable>

        <Pressable
          className="px-4 py-4 border-b border-border active:bg-card"
          onPress={() =>
            router.push({ pathname: "/category-list", params: { type: "expense" } })
          }
        >
          <Text className="text-base text-text">Expense Category Setting</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
