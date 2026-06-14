import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Delete, Lock } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { getColors } from "../lib/colors";
import { verifyPasscode } from "../lib/passcode";
import { cn } from "../lib/cn";

const PIN_LENGTH = 4;

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

type Props = {
  onUnlock: () => void;
};

export function LockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const c = getColors(useColorScheme().colorScheme);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    let cancelled = false;
    verifyPasscode(pin).then((ok) => {
      if (cancelled) return;
      if (ok) {
        onUnlock();
      } else {
        setError(true);
        setPin("");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin, onUnlock]);

  const press = (key: string) => {
    setError(false);
    if (key === "backspace") {
      setPin((p) => p.slice(0, -1));
    } else if (key !== "" && pin.length < PIN_LENGTH) {
      setPin((p) => p + key);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 items-center justify-between py-10">
        <View className="flex-1 items-center justify-center">
          <Lock size={40} color={c.text} strokeWidth={1.5} />
          <Text className="text-lg font-semibold text-text mt-4">
            Enter passcode
          </Text>
          <Text
            className={cn(
              "text-sm mt-1",
              error ? "text-error" : "text-text-secondary",
            )}
          >
            {error ? "Wrong passcode, try again" : "Unlock Shareef Money"}
          </Text>

          <View className="flex-row gap-4 mt-8">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2",
                  i < pin.length
                    ? "bg-primary border-primary"
                    : "border-text-secondary",
                )}
              />
            ))}
          </View>
        </View>

        <View className="w-full max-w-xs px-6">
          <View className="flex-row flex-wrap">
            {KEYS.map((key, i) => (
              <View key={i} className="w-1/3 items-center justify-center py-2">
                {key === "" ? (
                  <View className="w-16 h-16" />
                ) : (
                  <Pressable
                    className="w-16 h-16 items-center justify-center rounded-full active:bg-card"
                    onPress={() => press(key)}
                  >
                    {key === "backspace" ? (
                      <Delete size={26} color={c.text} />
                    ) : (
                      <Text className="text-2xl text-text">{key}</Text>
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
