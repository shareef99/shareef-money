import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-3xl font-semibold text-black dark:text-white">
          Shareef Money
        </Text>
      </SafeAreaView>
    </View>
  );
}
